import * as Sentry from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  mobileReplayIntegration: jest.fn(() => 'mobile-replay-integration'),
}));

// jest.setup.js가 EXPO_PUBLIC_SENTRY_DSN을 'test-placeholder' DSN으로 고정하고, sentry.ts의 isValidDsn은
// 이 값을 걸러내므로 테스트 환경에서는 Sentry.init이 호출되지 않아야 한다.
describe('sentry init', () => {
  it('does not initialize Sentry, because the DSN is the test placeholder', () => {
    // Import for side effects: sentry.ts calls Sentry.init(...) at module load time, gated
    // on isValidDsn. Any earlier import already exercised this (module singleton), so this
    // require is here for documentation/intent — it does not re-run the module body.
    require('../sentry');

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not build the mobile replay integration either, since it lives inside the same gated block', () => {
    expect(Sentry.mobileReplayIntegration).not.toHaveBeenCalled();
  });

  it('유효한 DSN이면 replay 통합과 함께 Sentry를 초기화한다', () => {
    const original = process.env.EXPO_PUBLIC_SENTRY_DSN;
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://public@o1.ingest.sentry.io/123';
    let isolatedSentry: { init: jest.Mock; mobileReplayIntegration: jest.Mock } | undefined;
    try {
      jest.isolateModules(() => {
        require('../sentry');
        isolatedSentry = require('@sentry/react-native');
      });
    } finally {
      process.env.EXPO_PUBLIC_SENTRY_DSN = original;
    }

    expect(isolatedSentry!.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o1.ingest.sentry.io/123',
        integrations: ['mobile-replay-integration'],
      })
    );
  });
});
