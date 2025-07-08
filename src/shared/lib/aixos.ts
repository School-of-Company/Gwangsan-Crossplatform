import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getData } from './getData';
import { setData } from './setData';
import { removeData } from './removeData';
import { authConfig } from './auth';
export const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const instance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getData('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getData('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await instance.post<{ token: string }>('/auth/reissue', {
          refreshToken,
        });

        const { token } = response.data;
        setData('token', token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return instance(originalRequest);
      } catch (error) {
        removeData('token');
        removeData('refreshToken');
        window.location.href = authConfig.signInPage;
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
