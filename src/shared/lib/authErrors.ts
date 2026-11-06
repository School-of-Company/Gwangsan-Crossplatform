// 의존성 없이 두어, axios를 mock한 테스트나 QueryProvider에서도 instanceof로 구분할 수 있게 한다

// 기기가 잠겨 SecureStore(Keychain)에서 토큰을 읽지 못한 경우. 토큰이 만료된 것이 아니므로
// 로그아웃하지 않고 요청만 실패시킨다
export class TokenStorageError extends Error {
  constructor(cause: unknown) {
    super('토큰을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.');
    this.name = 'TokenStorageError';
    this.cause = cause;
  }
}

// 재발급할 수 없어 다시 로그인해야 하는 경우. 기다리던 요청들도 같은 한국어 메시지로 실패한다
export class SessionExpiredError extends Error {
  constructor(cause?: unknown) {
    super('세션이 만료되었습니다. 다시 로그인해 주세요.');
    this.name = 'SessionExpiredError';
    this.cause = cause;
  }
}
