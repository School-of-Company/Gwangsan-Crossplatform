import * as Sentry from '@sentry/react-native';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  mobileReplayIntegration: jest.fn(() => 'mobile-replay-integration'),
}));

// sentry.ts calls Sentry.init(...) once, as a module-load side effect.
// EXPO_PUBLIC_SENTRY_DSN is inlined at build time by the react-native-dotenv babel
// plugin, so it can't be overridden here — assert its shape instead of a fixed value.
require('../sentry');

describe('sentry init', () => {
  it('initializes Sentry with the expected configuration exactly once', () => {
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: expect.any(String),
      tracesSampleRate: 0.2,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: ['mobile-replay-integration'],
    });
  });

  it('includes the mobile replay integration', () => {
    expect(Sentry.mobileReplayIntegration).toHaveBeenCalledTimes(1);
  });
});
