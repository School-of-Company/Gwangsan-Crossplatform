import * as Sentry from '@sentry/react-native';
import { AxiosError } from 'axios';
import { isNetworkOrTimeoutError } from './errorHandler';

// 4xx(비밀번호·인증번호 오류 등)와 네트워크 실패는 사용자 입력·기기 상태에 따른 예상된 실패다
const isExpectedRequestFailure = (error: unknown): boolean => {
  if (isNetworkOrTimeoutError(error)) return true;
  const status = error instanceof AxiosError ? error.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500;
};

export const logger = {
  error: (message: string, error?: unknown): void => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error instanceof Error ? error : new Error(message));
    }
  },
  warn: (message: string, data?: unknown): void => {
    if (__DEV__) {
      console.warn(message, data);
    } else {
      Sentry.captureMessage(message, {
        level: 'warning',
        extra: { data },
      });
    }
  },
  // API 호출 실패용. 예상된 실패는 이후 이벤트의 맥락으로만 남기고(breadcrumb), 5xx·알 수 없는
  // 에러만 예외로 보낸다
  requestError: (message: string, error: unknown): void => {
    if (__DEV__) {
      console.warn(message, error);
      return;
    }
    if (isExpectedRequestFailure(error)) {
      Sentry.addBreadcrumb({
        category: 'api',
        message,
        level: 'warning',
        data: { status: error instanceof AxiosError ? error.response?.status : undefined },
      });
      return;
    }
    Sentry.captureException(error instanceof Error ? error : new Error(message));
  },
};
