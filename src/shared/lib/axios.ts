import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { setData } from './setData';
import { getAccessToken, getRefreshToken, clearAuthTokens } from './auth';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { logger } from './logger';

export const baseURL = Constants.expoConfig?.extra?.apiUrl;

let queryClientInstance: QueryClient | null = null;

export const setQueryClientInstance = (client: QueryClient) => {
  queryClientInstance = client;
};

let refreshPromise: Promise<string> | null = null;

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
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const startTime = (originalRequest as any).__sentryStartTime;
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
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/auth/reissue');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      if (refreshPromise) {
        try {
          const token = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return instance(originalRequest);
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

        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await instance.post<{ accessToken: string }>('/auth/reissue', {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        await setData('accessToken', newAccessToken);
        return newAccessToken;
      })();

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        Sentry.captureException(refreshError, {
          extra: {
            context: 'token_refresh_failed',
            url: originalRequest.url,
            errorMessage:
              refreshError instanceof Error ? refreshError.message : String(refreshError),
          },
        });

        await clearAuthTokens();

        if (queryClientInstance) {
          queryClientInstance.clear();
        }

        try {
          router.replace('/signin');
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
