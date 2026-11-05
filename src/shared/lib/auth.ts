import * as Keychain from 'react-native-keychain';
import { getData } from './getData';
import { removeData } from './removeData';

type AuthConfig = {
  signInPage: string;
  protectedPages: readonly string[];
  publicPages: readonly string[];
};

export const authConfig: AuthConfig = {
  signInPage: '/signin/nickname',
  protectedPages: [],
  publicPages: ['/signin/nickname', '/signin/password', '/signup/terms', '/onboarding'],
} as const;

export const getAccessToken = async (): Promise<string | null> => {
  return await getData('accessToken');
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await getData('refreshToken');
};

export const clearAuthTokens = async (): Promise<void> => {
  await Promise.allSettled([
    removeData('accessToken'),
    removeData('refreshToken'),
    // 생체 로그인을 지원하던 이전 버전이 키체인에 남긴 토큰 사본을 지운다
    Keychain.resetGenericPassword(),
  ]);
};
