import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { getData } from './getData';
import { removeData } from './removeData';
import { setData } from './setData';
import { QueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

export const baseURL = Constants.expoConfig?.extra?.apiUrl;

let queryClientInstance: QueryClient | null = null;

export const setQueryClientInstance = (client: QueryClient) => {
  queryClientInstance = client;
};

let isRefreshing = false;
let refreshSubscribers: ((token: string | null, error?: any) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null, error?: any) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token, null));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach((cb) => cb(null, error));
  refreshSubscribers = [];
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
    const accessToken = await getData('accessToken');
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

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRequest =
      originalRequest.url?.includes('/auth/signin') ||
      originalRequest.url?.includes('/auth/reissue');

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

      try {
        Sentry.addBreadcrumb({
          category: 'auth',
          message: `401 on ${originalRequest.url}, attempting token refresh`,
          level: 'warning',
        });

        const refreshToken = await getData('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await instance.post<{ accessToken: string }>('/auth/reissue', {
          refreshToken,
        });

        const { accessToken } = response.data;
        await setData('accessToken', accessToken);

        isRefreshing = false;
        onTokenRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (error) {
        isRefreshing = false;
        onRefreshFailed(error);

        Sentry.captureException(error, {
          extra: {
            context: 'token_refresh_failed',
            url: originalRequest.url,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });

        await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

        if (queryClientInstance) {
          queryClientInstance.clear();
        }

        try {
          router.replace('/signin');
        } catch (routerError) {
          console.warn('Router navigation failed:', routerError);
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
