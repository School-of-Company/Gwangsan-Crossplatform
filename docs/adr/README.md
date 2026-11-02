# Architecture Decision Records

이 프로젝트에서 내린 주요 설계 결정을 기록합니다. 각 문서는 배경 · 결정 · 결과(트레이드오프) 순서로 씁니다.

| 번호                                           | 제목                                       | 상태 |
| ---------------------------------------------- | ------------------------------------------ | ---- |
| [0001](0001-fsd-layers-enforced-by-lint.md)    | FSD 레이어 채택과 ESLint로 경계 강제       | 채택 |
| [0002](0002-zustand-react-query-separation.md) | Zustand와 React Query의 역할 분리          | 채택 |
| [0003](0003-chat-send-queue.md)                | 채팅 전송 대기열과 재시도 설계             | 채택 |
| [0004](0004-fix-test-timezone.md)              | 테스트 실행 타임존을 Asia/Seoul로 고정     | 채택 |
| [0005](0005-raise-coverage-threshold.md)       | 커버리지 하한을 실제 수준 바로 아래로 상향 | 채택 |

새 ADR은 다음 번호로 파일을 만들고 위 표에 추가합니다. 결정을 뒤집을 때는 기존 문서를 지우지 않고 상태를 "대체됨(→ 새 번호)"으로 바꿉니다.
