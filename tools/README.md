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
