# ADR-0001: FSD 레이어 채택과 ESLint로 경계 강제

- 상태: 채택
- 관련: #741

## 배경

화면 수가 늘면서 컴포넌트·훅·API 호출이 어디에 있어야 하는지 기준이 필요했습니다. Feature-Sliced Design을 변형해
`app → view → widget → entity → shared` 다섯 레이어를 두고, 규칙을 `.claude/rules/fsd-architecture.md` 문서로 정리했습니다.

그런데 규칙이 문서로만 있을 때는 리뷰에서 놓치는 경우가 많아, 위로 향하는 import와 같은 레이어 슬라이스 간 import가
18건까지 쌓였습니다. 위반이 쌓이면 순환 의존이 생기고, 한 도메인을 고칠 때 영향 범위를 예측하기 어려워집니다.

## 결정

- 레이어 순위를 `shared(1) < entity(2) < widget(3) < view(4) < app(5)`로 두고, **자기보다 높은 레이어를 import하면 오류**로 봅니다.
- `entity`·`widget`·`view`는 도메인 슬라이스(`chat`, `post` …)로 나뉘며, **같은 레이어의 다른 슬라이스를 import하면 오류**로 봅니다.
  공유가 필요하면 한 단계 아래 레이어로 내립니다.
- 이를 로컬 ESLint 규칙 [`scripts/eslint/fsd-layers.js`](../../scripts/eslint/fsd-layers.js)로 구현하고,
  [`eslint.config.js`](../../eslint.config.js)에서 `src/**/*.{ts,tsx}`에 `fsd/layer-imports: 'error'`로 켭니다.
  - `~/`·`@/` 별칭과 상대 경로를 모두 실제 경로로 풀어서 판정하므로, 상대 경로로 우회할 수 없습니다.
  - 규칙 자체를 [`scripts/eslint/__tests__/fsd-layers.test.js`](../../scripts/eslint/__tests__/fsd-layers.test.js)로 테스트합니다.
- 기존 위반 18건은 규칙을 켜면서 모두 정리했습니다.

## 결과

- 레이어 위반은 lint 단계(로컬 pre-commit의 lint-staged와 CI의 `npm run lint`)에서 바로 실패하므로 리뷰에서 확인할 필요가 없습니다.
- 외부 플러그인(`eslint-plugin-boundaries` 등) 대신 100줄이 안 되는 로컬 규칙을 써서, 이 프로젝트의 별칭 구성과 레이어 이름에 그대로 맞출 수 있습니다.
  대신 규칙 유지 보수는 직접 해야 합니다.
- 같은 레이어 슬라이스 간 import 금지 때문에 공통 로직을 `shared`나 `entity`로 내리는 작업이 가끔 필요합니다.
