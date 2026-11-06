import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ReactNativeOptions } from '@sentry/react-native';

type BeforeSend = NonNullable<ReactNativeOptions['beforeSend']>;
type BeforeBreadcrumb = NonNullable<ReactNativeOptions['beforeBreadcrumb']>;

// 빌드 시 주입되는 값. 테스트 환경에서는 jest.setup.js의 placeholder로 고정된다.
const ENV_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

const DSN_PATTERN = /^https:\/\/[^@]+@[^/]+\/\d+$/;

// DSN이 실제 Sentry 프로젝트 주소 형태이고 테스트용 placeholder가 아닐 때만 유효하다.
export const isValidSentryDsn = (dsn: string | undefined): dsn is string =>
  !!dsn && DSN_PATTERN.test(dsn) && !dsn.includes('test-placeholder');

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

const SENSITIVE_EXTRA_KEY_PATTERN = /authorization|cookie|token|password|secret|phone|body/i;
const MAX_EXTRA_DEPTH = 5;

const isAxiosErrorLike = (
  value: object
): value is {
  name?: string;
  message?: string;
  code?: string;
  config?: { method?: string; url?: string };
  response?: { status?: number };
} => (value as { isAxiosError?: unknown }).isAxiosError === true;

// logger.warn 등으로 extra에 실린 값(AxiosError의 config.headers·요청 바디 포함)에서 토큰·비밀번호·
// 전화번호가 나가지 않도록, 민감한 키는 가리고 axios 에러는 상태·경로만 남긴다
const scrubExtraValue = (value: unknown, depth: number): unknown => {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_EXTRA_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => scrubExtraValue(item, depth + 1));
  if (isAxiosErrorLike(value)) {
    return {
      name: value.name,
      message: value.message,
      code: value.code,
      status: value.response?.status,
      method: value.config?.method,
      url: value.config?.url ? stripQueryString(value.config.url) : value.config?.url,
    };
  }
  if (value instanceof Error) return value;

  const scrubbed: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_EXTRA_KEY_PATTERN.test(key)) {
      scrubbed[key] = REDACTED;
    } else if (key === 'url' && typeof item === 'string') {
      scrubbed[key] = stripQueryString(item);
    } else {
      scrubbed[key] = scrubExtraValue(item, depth + 1);
    }
  }
  return scrubbed;
};

// Sentry 이벤트(에러/트랜잭션)에 Authorization 헤더, 요청 바디, 쿼리스트링이 그대로
// 담기지 않도록 전송 직전에 걸러낸다.
export const beforeSend: BeforeSend = (event) => {
  if (event.extra) {
    event.extra = scrubExtraValue(event.extra, 0) as typeof event.extra;
  }

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

export const beforeBreadcrumb: BeforeBreadcrumb = (breadcrumb) => scrubBreadcrumb(breadcrumb);

// DSN을 인자로 받아 테스트에서 유효/무효 DSN을 각각 주입해 볼 수 있게 한다.
// 초기화했으면 true, DSN이 유효하지 않아 건너뛰었으면 false를 반환한다.
export const initSentry = (dsn: string | undefined = ENV_DSN): boolean => {
  if (!isValidSentryDsn(dsn)) return false;

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
  return true;
};

initSentry();
