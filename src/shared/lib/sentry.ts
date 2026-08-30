import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const isValidDsn =
  !!dsn && /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn) && !dsn.includes('test-placeholder');

if (isValidDsn) {
  Sentry.init({
    dsn,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.mobileReplayIntegration()],
  });
}
