import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ReactNativeOptions } from '@sentry/react-native';

type BeforeSend = NonNullable<ReactNativeOptions['beforeSend']>;
type BeforeBreadcrumb = NonNullable<ReactNativeOptions['beforeBreadcrumb']>;

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const isValidDsn =
  !!dsn && /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn) && !dsn.includes('test-placeholder');

const REDACTED = '[Filtered]';
const SENSITIVE_HEADER_KEYS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
]);

// 이벤트/브레드크럼에 담기는 URL에서 쿼리스트링(토큰·개인정보가 실릴 수 있는 부분)을 제거한다.
const stripQueryString = (url: string): string => url.split('?')[0];

const scrubHeaders = (
  headers: Record<string, string> | undefined
): Record<string, string> | undefined => {
  if (!headers) return headers;
  const scrubbed: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    scrubbed[key] = SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? REDACTED : value;
  }
  return scrubbed;
};

// Sentry 이벤트(에러/트랜잭션)에 Authorization 헤더, 요청 바디, 쿼리스트링이 그대로
// 담기지 않도록 전송 직전에 걸러낸다.
const beforeSend: BeforeSend = (event) => {
  if (event.request) {
    event.request = {
      ...event.request,
      headers: scrubHeaders(event.request.headers),
      data: event.request.data != null ? REDACTED : event.request.data,
      cookies: event.request.cookies ? ({ '*': REDACTED } as Record<string, string>) : undefined,
      query_string: event.request.query_string ? REDACTED : event.request.query_string,
      url: event.request.url ? stripQueryString(event.request.url) : event.request.url,
    };
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  }

  return event;
};

// 개별 브레드크럼(HTTP 요청/응답 로그 등)에서도 동일하게 인증 헤더·바디·쿼리스트링을 제거한다.
const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => {
  if (breadcrumb.data) {
    const data: Record<string, unknown> = { ...breadcrumb.data };
    if (data.headers) data.headers = scrubHeaders(data.headers as Record<string, string>);
    if ('body' in data) data.body = REDACTED;
    if ('requestBody' in data) data.requestBody = REDACTED;
    if (typeof data.url === 'string') data.url = stripQueryString(data.url);
    breadcrumb.data = data;
  }
  if (typeof breadcrumb.message === 'string') {
    breadcrumb.message = stripQueryString(breadcrumb.message);
  }
  return breadcrumb;
};

const beforeBreadcrumb: BeforeBreadcrumb = (breadcrumb) => scrubBreadcrumb(breadcrumb);

if (isValidDsn) {
  Sentry.init({
    dsn,
    enabled: !__DEV__,
    ignoreErrors: [/:8081\b/],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend,
    beforeBreadcrumb,
    integrations: [Sentry.mobileReplayIntegration({ maskAllText: true, maskAllImages: true })],
  });
}
