# 유캔드럼 청음 트레이너 — 작업 안내

## 현재 상태
- `index.html` 한 파일(약 1,600줄)에 HTML·CSS·JS가 모두 들어 있는 청음 훈련 웹앱이다.
- 모드: 코스(Course) / 멜로디 받아쓰기 / 코드 종류 / 코드 진행(도수) / 리듬 받아쓰기 / 스케일 / 음정 / 기록(Stats)
- 소리: `samples/`(피아노), `samples/harp`, `samples/guitar`, `samples/drums` 의 mp3 샘플을 Web Audio API로 재생
- 악보 표시: `vendor/vexflow.js` (VexFlow 4, 전역 `Vex.Flow`)
- 기록 저장: localStorage (`eartr_` 접두어). 적응 출제 기록은 `eartr_adapt` (모드별 항목 상태·착각 쌍), 누적 정답률은 `eartr_stats`.
- 적응 출제 (Adaptive): 모든 모드 공통 엔진(`adaptRecord`/`adaptWeight`/`adaptPick`). 항목 key는 멜로디 `d:도수(반음)`·`l:도약(스케일 단계)`·`rest`·`oct`·`v:길이`, 코드 진행 `c:코드`·`p:앞>뒤`·`g:진행`, 리듬 `p:패턴`·`b:박자|박`·`s:박자`·`o:홑/겹|박안위치틱`·`e:tie/rest/sync`, 코드·스케일은 id, 음정은 `id:방향`.
- 빌드 도구 없음. 정적 파일만으로 GitHub Pages에서 동작해야 한다.
- 화면 자동 확인: `tools/shot.mjs`(캡처), `tools/flow.mjs`(모든 탭×난이도×PC·휴대폰 실행 테스트). 사용법은 `tools/README.md`.
- 기록을 기기 간에 공유하는 방안은 `docs/기록-동기화-방안.md`에 정리되어 있다(아직 구현 안 함).

## 목표 구조 (리팩터링)
기능은 그대로 유지하면서 한 파일을 아래처럼 나눈다. 빌드 도구 없이 `<script type="module">`로 불러온다.

```
index.html            화면 뼈대(탭, 패널)만
css/style.css         모든 스타일
js/main.js            탭 전환, 초기화, 단축키
js/store.js           localStorage 저장/불러오기
js/audio.js           샘플 로딩, 음 재생, 리버브, 메트로놈/카운트인
js/theory.js          음이름·조성·스케일·코드·음정 데이터와 철자(spelling) 규칙
js/notation.js        VexFlow 악보/리듬 아이콘 그리기
js/ui.js              공통 UI(난이도 버튼, 보기 버튼, 채점 표시)
js/modes/melody.js    멜로디 받아쓰기
js/modes/chord.js     코드 종류
js/modes/prog.js      코드 진행
js/modes/rhythm.js    리듬 받아쓰기
js/modes/scale.js     스케일
js/modes/interval.js  음정
js/course.js          코스(단계 해금, 오늘의 연습)
js/stats.js           기록 화면
samples/ vendor/      그대로
```

## 작업 원칙
- 사용자는 코딩을 모르는 드럼 강사다. 설명은 한국어로 쉽게.
- UI 표기는 지금처럼 `한글 (English)` 형식을 유지한다.
- 리팩터링 전에 현재 동작을 Playwright 등으로 확인하고, 리팩터링 후 모든 탭이 똑같이 동작하는지 다시 테스트한다.
- 작업 단위마다 커밋한다.
- 기존 localStorage 기록이 사라지지 않게 키 이름을 유지한다.
- 모바일(폭 380px)에서도 버튼이 잘 눌리게 한다.

## 나중에 할 것 (지금은 하지 않음)
- 드럼 그루브 받아쓰기 (별도 프로젝트)
- 선생님–학생 숙제·기록 공유
