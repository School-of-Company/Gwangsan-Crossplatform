import { instance } from '@/shared/lib/axios';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { SigninFormData, AuthResponse } from '~/entity/auth/model/authState';
import axios from 'axios';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';
import * as Keychain from 'react-native-keychain';

const auth = axios.create({
  baseURL: instance.defaults.baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const signin = async (formData: SigninFormData): Promise<AuthResponse> => {
  try {
    const response = await auth.post<AuthResponse>('/auth/signin', {
      nickname: formData.nickname,
      password: formData.password,
      deviceToken: formData.deviceToken,
      deviceId: formData.deviceId,
      osType: formData.osType,
    });

    const { accessToken, refreshToken } = response.data;

    await Promise.all([setData('accessToken', accessToken), setData('refreshToken', refreshToken)]);

    return response.data;
  } catch (error) {
    throw toAppError(error);
  }
};

export const saveCredentialsForBiometric = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    const supportedBiometry = await Keychain.getSupportedBiometryType();
    if (!supportedBiometry) return;

    await Keychain.setGenericPassword(accessToken, refreshToken, {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      authenticationPrompt: { title: '생체 인증으로 로그인' },
    });
  } catch (error) {
    logger.error('Failed to save tokens for biometric auth', error);
  }
};

export const getCredentialsForBiometric = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  try {
    const result = await Keychain.getGenericPassword({
      authenticationPrompt: {
        title: '생체 인증으로 로그인',
        cancel: '취소',
      },
    });

    if (!result) return null;

    return { accessToken: result.username, refreshToken: result.password };
  } catch (error) {
    logger.error('Biometric auth failed', error);
    return null;
  }
};

export const signinWithDeviceInfo = async (credentials: {
  nickname: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const deviceInfo = await getDeviceInfo();

    const formData: SigninFormData = {
      ...credentials,
      ...deviceInfo,
    };

    return await signin(formData);
  } catch (error) {
    logger.error('signinWithDeviceInfo failed', error);
    throw toAppError(error);
  }
};
