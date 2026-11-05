# 화면 확인 도구 (Playwright)

빌드 도구 없이 정적 파일만 쓰는 앱이라, 수정 뒤 모든 탭이 PC(1366px)와 아이폰(390px)에서 똑같이 동작하는지 자동으로 확인하는 스크립트입니다.

```bash
# 1. 저장소 폴더에서 정적 서버 실행
python3 -m http.server 8765 --bind 127.0.0.1

# 2. (다른 터미널) 전체 탭 화면 캡처 → shots/ 폴더
mkdir -p shots && node tools/shot.mjs shots

# 3. 모든 탭 × 난이도 × PC·휴대폰 실행 테스트 (문제 생성 → 답 입력 → 채점). 오류가 있으면 마지막에 출력
node tools/flow.mjs shots
```

`playwright` 패키지와 Chromium이 설치되어 있어야 합니다 (`npm i -D playwright && npx playwright install chromium`).

## 기능별 테스트
```bash
node tools/mock-sync-server.mjs &   # 가짜 구글 시트 서버 (127.0.0.1:8770) — features.mjs의 동기화 시험용
node tools/features.mjs            # 틀린 문제 복습 · 날짜별 기록 · 느린 정답 · 이동도 · 코스 · 두 기기 동기화
node tools/offline.mjs             # 한 번 연 뒤 인터넷을 끊어도 열리는지 (서비스 워커)
node tools/tuplets.mjs             # 3·5·6·7연음 출제·입력·채점, 메트로놈 옵션
node tools/edit.mjs                # 악보 음표 눌러 바로 고치기
node tools/adaptive.mjs            # 적응 출제 기록과 출제 빈도
```
스크린샷은 `shots/flow/` 폴더가 있어야 저장됩니다 (`mkdir -p shots/flow`).
