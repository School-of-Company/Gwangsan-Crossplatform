import * as Sentry from '@sentry/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { logger } from '../logger';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

const mockAddBreadcrumb = Sentry.addBreadcrumb as jest.MockedFunction<typeof Sentry.addBreadcrumb>;

const makeAxiosError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, null, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

const mockCaptureException = Sentry.captureException as jest.MockedFunction<
  typeof Sentry.captureException
>;
const mockCaptureMessage = Sentry.captureMessage as jest.MockedFunction<
  typeof Sentry.captureMessage
>;

describe('logger', () => {
  const originalDev = (global as unknown as { __DEV__: boolean }).__DEV__;

  afterEach(() => {
    jest.clearAllMocks();
    (global as unknown as { __DEV__: boolean }).__DEV__ = originalDev;
  });

  describe('__DEV__ 환경', () => {
    beforeEach(() => {
      (global as unknown as { __DEV__: boolean }).__DEV__ = true;
    });

    it('error: console.error를 호출하고 Sentry는 호출하지 않는다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('개발 환경 에러');

      logger.error('에러 메시지', error);

      expect(consoleSpy).toHaveBeenCalledWith('에러 메시지', error);
      expect(mockCaptureException).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('warn: console.warn을 호출하고 Sentry는 호출하지 않는다', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      logger.warn('경고 메시지', { detail: 'x' });

      expect(consoleSpy).toHaveBeenCalledWith('경고 메시지', { detail: 'x' });
      expect(mockCaptureMessage).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('프로덕션 환경 (__DEV__ = false)', () => {
    beforeEach(() => {
      (global as unknown as { __DEV__: boolean }).__DEV__ = false;
    });

    it('error: Error 인스턴스가 전달되면 그대로 Sentry.captureException에 전달한다', () => {
      const error = new Error('프로덕션 에러');

      logger.error('에러 메시지', error);

      expect(mockCaptureException).toHaveBeenCalledWith(error);
    });

    it('error: Error가 아닌 값이 전달되면 message로 새 Error를 만들어 전달한다', () => {
      logger.error('에러 메시지', { some: 'non-error-value' });

      expect(mockCaptureException).toHaveBeenCalledWith(new Error('에러 메시지'));
    });

    it('error: error 인자가 없으면 message로 새 Error를 만들어 전달한다', () => {
      logger.error('에러 메시지만 있음');

      expect(mockCaptureException).toHaveBeenCalledWith(new Error('에러 메시지만 있음'));
    });

    it('warn: Sentry.captureMessage를 level=warning, extra.data와 함께 호출한다', () => {
      logger.warn('경고 메시지', { detail: 'y' });

      expect(mockCaptureMessage).toHaveBeenCalledWith('경고 메시지', {
        level: 'warning',
        extra: { data: { detail: 'y' } },
      });
    });

    it.each([400, 401, 404])(
      'requestError: %i 응답은 예외 대신 breadcrumb로만 남긴다',
      (status) => {
        logger.requestError('sendSms failed', makeAxiosError(status));

        expect(mockCaptureException).not.toHaveBeenCalled();
        expect(mockAddBreadcrumb).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'api',
            message: 'sendSms failed',
            data: { status },
          })
        );
      }
    );

    it('requestError: 응답이 없는 네트워크 실패도 breadcrumb로만 남긴다', () => {
      logger.requestError(
        'sendSms failed',
        new AxiosError('Network Error', 'ERR_NETWORK', undefined, null, undefined)
      );

      expect(mockCaptureException).not.toHaveBeenCalled();
      expect(mockAddBreadcrumb).toHaveBeenCalled();
    });

    it('requestError: 5xx와 알 수 없는 에러는 captureException으로 보낸다', () => {
      const serverError = makeAxiosError(500);
      logger.requestError('sendSms failed', serverError);
      expect(mockCaptureException).toHaveBeenCalledWith(serverError);

      const unknownError = new Error('device info failed');
      logger.requestError('signin failed', unknownError);
      expect(mockCaptureException).toHaveBeenCalledWith(unknownError);
      expect(mockAddBreadcrumb).not.toHaveBeenCalled();
    });
  });
});
