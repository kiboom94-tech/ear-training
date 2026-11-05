/**
 * 유캔드럼 청음 트레이너 — 학생 기록 동기화용 Google Apps Script
 *
 * 설치 (선생님이 한 번만):
 *  1. 구글 시트를 하나 만들고 [확장 프로그램] → [Apps Script]를 연다.
 *  2. 이 파일 내용을 전부 붙여 넣고 저장한다.
 *  3. [배포] → [새 배포] → 유형 '웹 앱' → 실행 사용자 '나', 액세스 권한 '모든 사용자' → 배포.
 *  4. 나온 '웹 앱 URL'(https://script.google.com/macros/s/…/exec)을 학생들에게 알려 준다.
 *
 * 시트 두 개가 자동으로 생긴다.
 *  - '학생 기록': 선생님이 보는 요약 (학생 코드, 이름, 마지막 동기화, 오늘·최근 7일 문제 수, 영역별 정답률, 약점)
 *  - 'data': 앱이 쓰는 원본 데이터 (건드리지 마세요)
 */
const SHEET_DATA = 'data';
const SHEET_SUM = '학생 기록';
const SUM_HEAD = ['학생 코드', '이름', '마지막 동기화', '오늘 푼 문제', '연속 연습(일)', '최근 7일 문제', '최근 7일 정답률',
  '코스 통과 단계', '멜로디', '코드', '코드 진행', '리듬', '스케일', '음정', '약점 (배우는 중)'];
const CHUNK = 45000; // 셀 하나에 5만 자까지라서 나눠 저장

function sheet_(name, head) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(head); s.setFrozenRows(1); }
  return s;
}
function clean_(c) { return String(c || '').trim().toUpperCase().replace(/[^A-Z0-9가-힣_-]/g, '').slice(0, 40); }
function findRow_(s, code) {
  const n = s.getLastRow(); if (n < 2) return 0;
  const v = s.getRange(2, 1, n - 1, 1).getDisplayValues();
  for (let i = 0; i < v.length; i++) if (v[i][0] === code) return i + 2;
  return 0;
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* 학생 기록 읽기: ?code=학생코드 */
function doGet(e) {
  const code = clean_(e.parameter.code);
  if (!code) return out_({ ok: false, error: 'no code' });
  const s = sheet_(SHEET_DATA, ['코드', '갱신', '데이터']);
  const r = findRow_(s, code);
  if (!r) return out_({ ok: true, data: null });
  const last = s.getLastColumn();
  if (last < 3) return out_({ ok: true, data: null });
  const json = s.getRange(r, 3, 1, last - 2).getValues()[0].map(String).filter(x => x).map(x => x.slice(1)).join('');
  return out_({ ok: true, data: json ? JSON.parse(json) : null });
}

/* 학생 기록 저장: { code, name, data, summary } */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    const code = clean_(body.code);
    if (!code) return out_({ ok: false, error: 'no code' });
    const json = JSON.stringify(body.data || {});
    const chunks = [];
    for (let i = 0; i < json.length; i += CHUNK) chunks.push('J' + json.slice(i, i + CHUNK)); // 'J'를 붙여 수식·숫자로 바뀌지 않게
    const s = sheet_(SHEET_DATA, ['코드', '갱신', '데이터']);
    let r = findRow_(s, code); if (!r) r = s.getLastRow() + 1;
    const need = 2 + chunks.length;
    if (s.getMaxColumns() < need) s.insertColumnsAfter(s.getMaxColumns(), need - s.getMaxColumns());
    const last = s.getLastColumn();
    if (last > 2) s.getRange(r, 3, 1, last - 2).clearContent();
    s.getRange(r, 1, 1, need).setValues([["'" + code, new Date(), ...chunks]]);

    const sm = body.summary || {};
    const t = sheet_(SHEET_SUM, SUM_HEAD);
    let r2 = findRow_(t, code); if (!r2) r2 = t.getLastRow() + 1;
    const modes = (sm.modes || []).concat(['', '', '', '', '', '']).slice(0, 6);
    t.getRange(r2, 1, 1, SUM_HEAD.length).setValues([["'" + code, String(body.name || ''), new Date(), sm.today || 0, sm.streak || 0,
      sm.week || 0, sm.weekAcc || '', sm.cleared || 0, ...modes, sm.weak || '']]);
    return out_({ ok: true });
  } finally { lock.releaseLock(); }
}
