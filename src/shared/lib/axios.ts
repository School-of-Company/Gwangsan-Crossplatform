import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { getAccessToken } from './auth';
import { clearSession } from './clearSession';
import Toast from 'react-native-toast-message';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';
import { isNetworkOrTimeoutError } from './errorHandler';
import { instance } from './apiInstance';
import {
  readToken,
  refreshAccessToken,
  SessionExpiredError,
  TokenStorageError,
} from './tokenRefresh';

export { baseURL, instance } from './apiInstance';
export { SessionExpiredError, TokenStorageError } from './tokenRefresh';

let queryClientInstance: QueryClient | null = null;

export const setQueryClientInstance = (client: QueryClient) => {
  queryClientInstance = client;
};

// 재발급 요청의 중복 방지는 tokenRefresh가 맡는다. 이 값은 재발급을 시작한 요청이 세션 정리를
// 마칠 때까지 뒤이은 401도 같은 결과를 기다리게 해, 실패 시 다시 재발급하지 않도록 한다
let refreshPromise: Promise<string> | null = null;

type TimedRequestConfig = InternalAxiosRequestConfig & { __sentryStartTime?: number };

instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    (config as TimedRequestConfig).__sentryStartTime = Date.now();
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: `No accessToken found when requesting ${config.url}`,
        level: 'warning',
      });
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    const startTime = (response.config as TimedRequestConfig).__sentryStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;
    Sentry.addBreadcrumb({
      category: 'http',
      message: `${response.config.method?.toUpperCase()} ${response.config.url}`,
      level: 'info',
      data: {
        status: response.status,
        duration_ms: duration,
      },
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as (TimedRequestConfig & { _retry?: boolean }) | undefined;
    const startTime = originalRequest?.__sentryStartTime;
    const duration = startTime ? Date.now() - startTime : undefined;

    Sentry.addBreadcrumb({
      category: 'http',
      message: `${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
      level: 'error',
      data: {
        status: error.response?.status,
        duration_ms: duration,
      },
    });

    const isAuthRequest =
      originalRequest?.url?.includes('/auth/signin') ||
      originalRequest?.url?.includes('/auth/reissue');

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      // 이 요청이 나간 뒤 다른 요청이 이미 토큰을 재발급했다면(401이 늦게 도착한 경우) 다시
      // 재발급하지 않고 새 토큰으로 재시도한다. 그렇지 않으면 재발급이 연달아 일어난다
      if (!refreshPromise) {
        let latestAccessToken: string | null;
        try {
          latestAccessToken = await readToken(getAccessToken);
        } catch (storageError) {
          return Promise.reject(storageError);
        }
        const sentAuthorization = originalRequest.headers?.Authorization;
        if (
          latestAccessToken &&
          sentAuthorization &&
          sentAuthorization !== `Bearer ${latestAccessToken}`
        ) {
          originalRequest.headers.Authorization = `Bearer ${latestAccessToken}`;
          return await instance(originalRequest);
        }
      }

      if (refreshPromise) {
        try {
          const token = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return await instance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      refreshPromise = refreshAccessToken(`401 on ${originalRequest.url}`);

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return await instance(originalRequest);
      } catch (refreshError) {
        const cause =
          refreshError instanceof SessionExpiredError ? refreshError.cause : refreshError;
        const isMissingRefreshToken =
          cause instanceof Error && cause.message === 'No refresh token';

        const isNetworkOrTimeoutFailure = isNetworkOrTimeoutError(refreshError);
        const isTokenStorageFailure = refreshError instanceof TokenStorageError;

        if (isMissingRefreshToken) {
          // 이미 로그아웃되어 리프레시 토큰이 없는 상태에서의 잔여 요청 401은
          // 예상된 흐름이므로 Sentry 예외로 남기지 않고 breadcrumb만 남긴다.
          Sentry.addBreadcrumb({
            category: 'auth',
            message: 'Token refresh skipped: no refresh token available',
            level: 'info',
          });
        } else if (isTokenStorageFailure) {
          // 기기가 잠겨 토큰을 읽지 못한 경우로, 토큰 자체는 유효할 수 있다
          Sentry.addBreadcrumb({
            category: 'auth',
            message: 'Token refresh skipped: token storage unavailable',
            level: 'warning',
          });
        } else if (isNetworkOrTimeoutFailure) {
          // 기기/네트워크 상태에 의한 실패(오프라인, 5s 타임아웃 등)는 앱 버그가 아니므로
          // Sentry 예외로 남기지 않고 breadcrumb만 남긴다.
          Sentry.addBreadcrumb({
            category: 'auth',
            message: 'Token refresh skipped: network or timeout error',
            level: 'warning',
          });
        } else {
          Sentry.captureException(cause, {
            extra: {
              context: 'token_refresh_failed',
              url: originalRequest.url,
              errorMessage: cause instanceof Error ? cause.message : String(cause),
            },
          });
        }

        if (isNetworkOrTimeoutFailure || isTokenStorageFailure) {
          return Promise.reject(refreshError);
        }

        // 로그아웃으로 토큰이 모두 지워진 뒤 화면에 남은 쿼리가 보낸 요청이면 이미 로그아웃된
        // 상태이므로, 세션 만료 안내와 로그인 이동 없이 요청만 실패시킨다
        if (isMissingRefreshToken && !(await getAccessToken().catch(() => null))) {
          return Promise.reject(refreshError);
        }

        // 일반 로그아웃과 같은 범위로 세션을 정리한다. 이 경로는 재발급을 시작한 요청 하나만 타므로
        // 기다리던 요청이 여러 개여도 안내는 한 번만 뜬다
        await clearSession(queryClientInstance);
        Toast.show({ type: 'info', text1: '세션이 만료되었습니다. 다시 로그인해 주세요.' });

        try {
          router.replace('/signin/nickname');
        } catch (routerError) {
          logger.warn('Router navigation failed', routerError);
        }

        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);
