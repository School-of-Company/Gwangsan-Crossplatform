# ADR-0005: 커버리지 하한을 실제 수준 바로 아래로 상향

- 상태: 채택
- 관련: #741

## 배경

처음 둔 커버리지 하한은 Lines·Statements·Functions 45%, Branches 40%였습니다. 실제 커버리지가 그보다 훨씬 높아진 뒤에도
하한은 그대로여서, 테스트 없는 코드가 대량으로 들어와도 CI가 막지 못했습니다. 또 `main`·`develop`에 직접 push된 경우에는
단위 테스트가 전혀 돌지 않았습니다.

## 결정

- [`jest.config.js`](../../jest.config.js)의 `coverageThreshold.global`을 당시 실제 커버리지 바로 아래로 올립니다.

  | 지표       | 이전 | 현재 하한 | 상향 당시 실제 |
  | ---------- | ---- | --------- | -------------- |
  | Lines      | 45   | 95        | 98.4           |
  | Statements | 45   | 95        | 97.5           |
  | Functions  | 45   | 93        | 96.5           |
  | Branches   | 40   | 88        | 91.6           |

- 측정 대상은 `src/**/*.{ts,tsx}`이며, 로직 없는 Expo Router 라우트 파일(`src/app/**`)은 제외하고
  로직이 있는 라우트 파일만 하나씩 다시 포함합니다(현재 `src/app/index.tsx`).
- [`ci.yml`](../../.github/workflows/ci.yml)에서 PR은 `Unit Test Coverage` job이 커버리지 리포트를 코멘트로 남기고,
  `main`·`develop` push에서도 단위 테스트를 실행합니다.

## 결과

- 테스트 없는 코드가 크게 늘면 PR이 실패합니다. 하한과 실제 값 사이에 2~3%p 여유를 두어, 작은 변경으로 바로 실패하지는 않게 했습니다.
- 현재 `develop` 기준 실제 커버리지는 Lines 97.0 / Statements 96.0 / Functions 94.9 / Branches 90.4입니다.
  여유가 줄어든 만큼 새 코드는 테스트와 함께 들어와야 합니다.
- 커버리지가 더 오르면 하한도 함께 올리는 방식(ratchet)으로 유지합니다.
