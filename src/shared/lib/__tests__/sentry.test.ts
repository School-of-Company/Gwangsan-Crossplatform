import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';
import { beforeBreadcrumb, beforeSend, initSentry, isValidSentryDsn } from '../sentry';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  mobileReplayIntegration: jest.fn(() => 'mobile-replay-integration'),
}));

const mockInit = Sentry.init as jest.Mock;
const VALID_DSN = 'https://abc123@o123.ingest.sentry.io/456';

// jest.setup.js가 EXPO_PUBLIC_SENTRY_DSN을 test-placeholder로 고정하므로 모듈 로드 때의
// 자동 초기화는 항상 건너뛰고, 유효한 DSN 분기는 initSentry에 DSN을 직접 넘겨 확인한다.
describe('모듈 로드 시 초기화', () => {
  it('테스트 placeholder DSN이면 Sentry를 초기화하지 않는다', () => {
    expect(mockInit).not.toHaveBeenCalled();
    expect(Sentry.mobileReplayIntegration).not.toHaveBeenCalled();
  });
});

describe('isValidSentryDsn', () => {
  it.each([
    [VALID_DSN, true],
    ['https://key@sentry.example.com/1', true],
    [undefined, false],
    ['', false],
    ['http://abc@o1.ingest.sentry.io/2', false],
    ['https://o1.ingest.sentry.io/2', false],
    ['https://abc@o1.ingest.sentry.io/project', false],
    ['https://test-placeholder@sentry.io/0', false],
  ])('%s → %s', (dsn, expected) => {
    expect(isValidSentryDsn(dsn)).toBe(expected);
  });
});

describe('initSentry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('유효하지 않은 DSN이면 초기화하지 않고 false를 반환한다', () => {
    expect(initSentry('not-a-dsn')).toBe(false);
    expect(initSentry(undefined)).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('인자를 생략하면 빌드 시 주입된 DSN(테스트에서는 placeholder)을 쓴다', () => {
    expect(initSentry()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('유효한 DSN이면 개인정보 필터와 마스킹된 리플레이로 초기화한다', () => {
    expect(initSentry(VALID_DSN)).toBe(true);

    expect(Sentry.mobileReplayIntegration).toHaveBeenCalledWith({
      maskAllText: true,
      maskAllImages: true,
    });
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: VALID_DSN,
        enabled: !__DEV__,
        tracesSampleRate: 0.2,
        beforeSend,
        beforeBreadcrumb,
        integrations: ['mobile-replay-integration'],
      })
    );
  });
});

describe('beforeSend', () => {
  it('요청의 인증 헤더·바디·쿠키·쿼리스트링을 가린다', () => {
    const event = {
      request: {
        url: 'https://api.gwangsan.io.kr/api/member?token=secret',
        headers: { Authorization: 'Bearer x', Cookie: 'a=b', 'Content-Type': 'application/json' },
        data: { password: '1234' },
        cookies: { session: 'abc' },
        query_string: 'token=secret',
      },
    } as unknown as ErrorEvent;

    const result = beforeSend(event, {}) as ErrorEvent;

    expect(result.request).toEqual({
      url: 'https://api.gwangsan.io.kr/api/member',
      headers: {
        Authorization: '[Filtered]',
        Cookie: '[Filtered]',
        'Content-Type': 'application/json',
      },
      data: '[Filtered]',
      cookies: { '*': '[Filtered]' },
      query_string: '[Filtered]',
    });
  });

  it('비어 있는 요청 필드는 그대로 둔다', () => {
    const event = { request: {} } as unknown as ErrorEvent;

    const result = beforeSend(event, {}) as ErrorEvent;

    expect(result.request).toEqual({
      headers: undefined,
      data: undefined,
      cookies: undefined,
      query_string: undefined,
      url: undefined,
    });
  });

  it('이벤트에 담긴 브레드크럼도 함께 걸러낸다', () => {
    const event = {
      breadcrumbs: [{ message: 'GET /post?q=1', data: { url: '/post?q=1', body: 'x' } }],
    } as unknown as ErrorEvent;

    const result = beforeSend(event, {}) as ErrorEvent;

    expect(result.breadcrumbs).toEqual([
      { message: 'GET /post', data: { url: '/post', body: '[Filtered]' } },
    ]);
  });

  it('extra의 토큰·비밀번호·전화번호·인증 헤더를 가리고 URL 쿼리스트링을 지운다', () => {
    const event = {
      extra: {
        data: {
          refreshToken: 'r-token',
          nested: { password: 'pw', phoneNumber: '01012345678', keep: 'ok' },
          headers: { Authorization: 'Bearer x', 'Content-Type': 'application/json' },
          url: '/member?token=secret',
          list: [{ accessToken: 'a' }],
        },
        context: 'token_refresh_failed',
      },
    } as unknown as ErrorEvent;

    const result = beforeSend(event, {}) as ErrorEvent;

    expect(result.extra).toEqual({
      data: {
        refreshToken: '[Filtered]',
        nested: { password: '[Filtered]', phoneNumber: '[Filtered]', keep: 'ok' },
        headers: { Authorization: '[Filtered]', 'Content-Type': 'application/json' },
        url: '/member',
        list: [{ accessToken: '[Filtered]' }],
      },
      context: 'token_refresh_failed',
    });
  });

  it('extra에 담긴 axios 에러는 요청 설정·바디 없이 상태와 경로만 남긴다', () => {
    const axiosError = Object.assign(new Error('Request failed'), {
      name: 'AxiosError',
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      config: {
        method: 'post',
        url: '/auth/signin?x=1',
        headers: { Authorization: 'Bearer x' },
        data: '{"password":"pw"}',
      },
      response: { status: 401, data: { message: 'no' } },
    });
    const event = { extra: { data: axiosError } } as unknown as ErrorEvent;

    const result = beforeSend(event, {}) as ErrorEvent;

    expect(result.extra).toEqual({
      data: {
        name: 'AxiosError',
        message: 'Request failed',
        code: 'ERR_BAD_REQUEST',
        status: 401,
        method: 'post',
        url: '/auth/signin',
      },
    });
  });

  it('request·breadcrumbs가 없는 이벤트는 그대로 반환한다', () => {
    const event = { message: 'boom' } as ErrorEvent;

    expect(beforeSend(event, {})).toEqual({ message: 'boom' });
  });
});

describe('beforeBreadcrumb', () => {
  it('헤더·요청 바디를 가리고 URL과 메시지의 쿼리스트링을 지운다', () => {
    const breadcrumb: Breadcrumb = {
      message: 'POST /auth/signin?redirect=1',
      data: {
        url: '/auth/signin?redirect=1',
        headers: { authorization: 'Bearer x', accept: '*/*' },
        requestBody: { password: '1234' },
      },
    };

    expect(beforeBreadcrumb(breadcrumb)).toEqual({
      message: 'POST /auth/signin',
      data: {
        url: '/auth/signin',
        headers: { authorization: '[Filtered]', accept: '*/*' },
        requestBody: '[Filtered]',
      },
    });
  });

  it('data와 message가 없으면 그대로 둔다', () => {
    expect(beforeBreadcrumb({ category: 'ui.click' })).toEqual({ category: 'ui.click' });
  });
});
