import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { setData } from './setData';
import { getAccessToken, getRefreshToken } from './auth';
import { clearSession } from './clearSession';
import { syncBiometricCredentials } from './biometricCredentials';
import Toast from 'react-native-toast-message';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';
import { isNetworkOrTimeoutError } from './errorHandler';

// env(API_URL)가 빌드에 주입되지 않은 경우(예: EAS 빌드에 env 미등록)에도
// 동작하도록 프로덕션 API 주소를 폴백으로 사용한다.
const FALLBACK_API_URL = 'https://api.gwangsan.io.kr/api';

export const baseURL: string = Constants.expoConfig?.extra?.apiUrl ?? FALLBACK_API_URL;

let queryClientInstance: QueryClient | null = null;

export const setQueryClientInstance = (client: QueryClient) => {
  queryClientInstance = client;
};

let refreshPromise: Promise<string> | null = null;

// 기기가 잠겨 SecureStore(Keychain)에서 토큰을 읽지 못한 경우. 토큰이 만료된 것이 아니므로
// 로그아웃하지 않고 요청만 실패시킨다(#737)
export class TokenStorageError extends Error {
  constructor(cause: unknown) {
    super('토큰을 읽지 못했습니다. 잠시 후 다시 시도해 주세요.');
    this.name = 'TokenStorageError';
    this.cause = cause;
  }
}

// 재발급할 수 없어 다시 로그인해야 하는 경우. 기다리던 요청들도 같은 한국어 메시지로 실패한다
export class SessionExpiredError extends Error {
  constructor(cause?: unknown) {
    super('세션이 만료되었습니다. 다시 로그인해 주세요.');
    this.name = 'SessionExpiredError';
    this.cause = cause;
  }
}

const readToken = async (read: () => Promise<string | null>) => {
  try {
    return await read();
  } catch (error) {
    throw new TokenStorageError(error);
  }
};

export const instance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    (config as any).__sentryStartTime = Date.now();
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
    const startTime = (response.config as any).__sentryStartTime;
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
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const startTime = (originalRequest as any)?.__sentryStartTime;
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
      // 재발급하지 않고 새 토큰으로 재시도한다. 그렇지 않으면 재발급이 연달아 일어난다(#737)
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

      refreshPromise = (async () => {
        Sentry.addBreadcrumb({
          category: 'auth',
          message: `401 on ${originalRequest.url}, attempting token refresh`,
          level: 'warning',
        });

        const refreshToken = await readToken(getRefreshToken);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await instance.post<{ accessToken: string; refreshToken?: string }>(
          '/auth/reissue',
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: rotatedRefreshToken } = response.data;
        // 서버가 refresh token을 교체해 내려주면 함께 저장한다. 예전 값을 계속 쓰면 다음 재발급이
        // 실패해 강제 로그아웃된다(#737)
        await Promise.all([
          setData('accessToken', newAccessToken),
          rotatedRefreshToken ? setData('refreshToken', rotatedRefreshToken) : Promise.resolve(),
        ]);
        // 생체 인증용 사본 갱신이 실패해도 요청 재시도는 막지 않는다
        syncBiometricCredentials(newAccessToken, rotatedRefreshToken ?? refreshToken).catch(
          (error) => logger.warn('Failed to sync biometric credentials', error)
        );
        return newAccessToken;
      })().catch((error: unknown) => {
        // 기다리던 요청들도 같은 에러를 받으므로, 로그아웃할 상황이면 한국어 안내로 바꿔 던진다
        if (error instanceof TokenStorageError || isNetworkOrTimeoutError(error)) throw error;
        throw new SessionExpiredError(error);
      });

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
