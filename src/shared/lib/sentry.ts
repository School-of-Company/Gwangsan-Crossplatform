import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const isValidDsn =
  !!dsn && /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn) && !dsn.includes('test-placeholder');

if (isValidDsn) {
  Sentry.init({
    dsn,
    enabled: !__DEV__,
    // enabled: !__DEV__로 개발 빌드의 이벤트 전송 자체를 막고 있지만, Metro 개발
    // 서버 통신 실패(DebugServerException 등)처럼 로컬 개발 환경에서만 발생하는
    // 노이즈는 혹시 모를 우회 경로(예: __DEV__ 오탐)에 대비해 이중으로 걸러낸다.
    ignoreErrors: ['DebugServerException'],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.mobileReplayIntegration()],
  });
}
