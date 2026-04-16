import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from '../errorHandler';

const makeAxiosError = (message: string, responseData?: unknown, status?: number): AxiosError => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response =
    responseData !== undefined || status !== undefined
      ? ({
          data: responseData,
          status: status ?? 400,
          statusText: 'Bad Request',
          headers: {},
          config,
        } as AxiosResponse)
      : undefined;

  const error = new AxiosError(message, 'ERR_BAD_REQUEST', config, null, response);
  return error;
};

describe('getErrorMessage', () => {
  describe('AxiosError — response data에 message 필드가 있을 때', () => {
    it('message에 "default message [xxx]" 패턴이 있으면 마지막 [...] 내용을 반환한다', () => {
      const error = makeAxiosError(
        'validation failed',
        { message: 'Validation failed: default message [비밀번호를 입력해주세요]' },
        400
      );
      expect(getErrorMessage(error)).toBe('비밀번호를 입력해주세요');
    });

    it('"default message [...]" 패턴이 여러 개면 마지막 것을 반환한다', () => {
      const error = makeAxiosError(
        'validation failed',
        {
          message:
            'Validation failed: default message [첫 번째 오류], default message [두 번째 오류]',
        },
        400
      );
      expect(getErrorMessage(error)).toBe('두 번째 오류');
    });

    it('message에 regex 패턴이 없으면 message 원문을 반환한다', () => {
      const error = makeAxiosError(
        'request failed',
        { message: '사용자를 찾을 수 없습니다.' },
        404
      );
      expect(getErrorMessage(error)).toBe('사용자를 찾을 수 없습니다.');
    });

    it('message가 빈 문자열이면 빈 문자열을 반환한다', () => {
      const error = makeAxiosError('request failed', { message: '' }, 400);
      expect(getErrorMessage(error)).toBe('');
    });
  });

  describe('AxiosError — response data에 message 필드가 없을 때', () => {
    it('status 코드가 있으면 "요청이 실패했습니다. (status)" 형태로 반환한다', () => {
      const error = makeAxiosError('server error', null, 500);
      expect(getErrorMessage(error)).toBe('요청이 실패했습니다. (500)');
    });

    it('status 403도 동일한 형태로 반환한다', () => {
      const error = makeAxiosError('forbidden', undefined, 403);
      expect(getErrorMessage(error)).toBe('요청이 실패했습니다. (403)');
    });

    it('response 자체가 없으면 error.message를 반환한다 (Error 폴백)', () => {
      const config = { headers: {} } as InternalAxiosRequestConfig;
      const error = new AxiosError('Network Error', 'ERR_NETWORK', config, null, undefined);
      expect(getErrorMessage(error)).toBe('Network Error');
    });
  });

  describe('일반 Error 인스턴스', () => {
    it('error.message를 그대로 반환한다', () => {
      expect(getErrorMessage(new Error('일반 오류 메시지'))).toBe('일반 오류 메시지');
    });

    it('빈 message인 Error도 그대로 반환한다', () => {
      expect(getErrorMessage(new Error(''))).toBe('');
    });
  });

  describe('문자열 error', () => {
    it('문자열을 그대로 반환한다', () => {
      expect(getErrorMessage('직접 전달된 에러 문자열')).toBe('직접 전달된 에러 문자열');
    });
  });

  describe('그 외 타입', () => {
    it('null이면 알 수 없는 오류 메시지를 반환한다', () => {
      expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('undefined이면 알 수 없는 오류 메시지를 반환한다', () => {
      expect(getErrorMessage(undefined)).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('숫자이면 알 수 없는 오류 메시지를 반환한다', () => {
      expect(getErrorMessage(404)).toBe('알 수 없는 오류가 발생했습니다.');
    });

    it('객체이면 알 수 없는 오류 메시지를 반환한다', () => {
      expect(getErrorMessage({ code: 'ERR' })).toBe('알 수 없는 오류가 발생했습니다.');
    });
  });
});
