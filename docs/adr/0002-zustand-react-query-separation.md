# ADR-0002: Zustand와 React Query의 역할 분리

- 상태: 채택

## 배경

앱 상태는 성격이 다른 두 종류가 섞여 있습니다.

- **서버 상태**: 게시글, 채팅방 목록, 프로필처럼 서버가 원본을 갖고 있고 캐시·재조회·무효화가 필요한 데이터
- **클라이언트 상태**: 회원가입 여러 단계에 걸친 입력값, 채팅 전송 대기열, 읽음 표시처럼 기기 안에서만 의미가 있는 데이터

둘을 한 저장소에 두면 서버 데이터를 수동으로 동기화해야 하고, 오래된 데이터가 남거나 로그아웃 후에도 이전 계정 데이터가 보이는 문제가 생깁니다.

## 결정

- **서버 상태는 React Query만** 사용합니다. 전역 설정은 [`src/shared/lib/QueryProvider.tsx`](../../src/shared/lib/QueryProvider.tsx)에 있습니다.
  - `staleTime` 5분, `refetchOnWindowFocus: false`
  - 4xx는 다시 보내도 결과가 같으므로 재시도하지 않고, 응답 없음·5xx만 한 번 재시도합니다.
  - RN에는 브라우저 focus/online 이벤트가 없으므로 `AppState`를 `focusManager`에, `NetInfo`를 `onlineManager`에 연결합니다.
  - 이미 받아둔 데이터가 있으면 백그라운드 재조회 실패로 화면 전체를 ErrorBoundary로 넘기지 않습니다.
- **UI·폼 상태는 Zustand만** 사용하며, 스토어는 [`src/shared/store/`](../../src/shared/store/)에만 둡니다. 모든 스토어는 `reset`을 갖습니다.
- 쿼리 키는 `['domain', param]` 배열을 쓰고, 여러 훅이 공유하면 `<name>QueryKeys.ts`로 분리합니다.
- 토큰은 둘 다 아닌 SecureStore/Keychain에 둡니다.

## 결과

- 서버 데이터의 갱신은 `invalidateQueries`로 일관되게 처리됩니다(예: 거래 취소 후 `myInformation` 무효화).
- 로그아웃 시 `clearSession`이 React Query 캐시와 계정에 묶인 Zustand 스토어(채팅 대기열·읽음 표시)를 함께 비워, 다음 계정에 이전 데이터가 남지 않습니다.
- 채팅처럼 둘이 겹치는 영역은 경계를 명시해야 합니다. 확정된 메시지는 React Query 캐시, 아직 서버가 확인하지 않은 메시지는
  Zustand 대기열에 두고 화면에서 합칩니다([ADR-0003](0003-chat-send-queue.md)).
