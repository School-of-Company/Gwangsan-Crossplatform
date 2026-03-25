import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { removeData } from './removeData';
import { setData } from './setData';
import { getAccessToken, getRefreshToken } from './auth';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

export const baseURL = Constants.expoConfig?.extra?.apiUrl;

let queryClientInstance: QueryClient | null = null;

export const setQueryClientInstance = (client: QueryClient) => {
  queryClientInstance = client;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null, error?: unknown) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null, error?: unknown) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];
  subscribers.forEach((cb) => cb(token, null));
};

const onRefreshFailed = (error: unknown) => {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];
  subscribers.forEach((cb) => cb(null, error));
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
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      Sentry.addBreadcrumb({
        category: 'auth',
        message: `No accessToken in AsyncStorage when requesting ${config.url}`,
        level: 'warning',
      });
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

  const isAuthRequest =
    originalRequest.url?.includes('/auth/signin') || originalRequest.url?.includes('/auth/reissue');

  if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token, error) => {
          if (error || !token) {
            return reject(error);
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(instance(originalRequest));
        });
      });
    }

    isRefreshing = true;

    let newAccessToken: string | null = null;
    let refreshError: unknown = null;

    try {
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

      newAccessToken = response.data.accessToken;
      await setData('accessToken', newAccessToken);
    } catch (error) {
      refreshError = error;

      Sentry.captureException(error, {
        extra: {
          context: 'token_refresh_failed',
          url: originalRequest.url,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      isRefreshing = false;

      if (newAccessToken) {
        onTokenRefreshed(newAccessToken);
      } else {
        onRefreshFailed(refreshError);
      }
    }

    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return instance(originalRequest);
    }

    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    if (queryClientInstance) {
      queryClientInstance.clear();
    }

    try {
      router.replace('/signin');
    } catch (routerError) {
      console.warn('Router navigation failed:', routerError);
    }

    return Promise.reject(refreshError);
  }

  return Promise.reject(error);
});
