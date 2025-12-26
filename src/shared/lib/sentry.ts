import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'SENTRY_DSN',
  enableInExpoDevelopment: true,
});
