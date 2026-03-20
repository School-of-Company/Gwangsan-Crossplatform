import { instance } from '@/shared/lib/axios';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { SigninFormData, AuthResponse } from '~/entity/auth/model/authState';
import axios from 'axios';
import { removeData } from '@/shared/lib/removeData';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import * as Keychain from 'react-native-keychain';

const auth = axios.create({
  baseURL: instance.defaults.baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const signin = async (formData: SigninFormData): Promise<AuthResponse> => {
  try {
    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);
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
    throw new Error(getErrorMessage(error));
  }
};

export const saveCredentialsForBiometric = async (nickname: string, password: string) => {
  const supportedBiometry = await Keychain.getSupportedBiometryType();
  if (!supportedBiometry) return;

  await Keychain.setGenericPassword(nickname, password, {
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    authenticationPrompt: { title: '생체 인증으로 로그인' },
  });
};

export const getCredentialsForBiometric = async () => {
  try {
    const result = await Keychain.getGenericPassword({
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      authenticationPrompt: {
        title: '생체 인증으로 로그인',
        cancel: '취소',
      },
    });

    if (!result) return null;

    return { nickname: result.username, password: result.password };
  } catch (error) {
    console.error('Biometric auth failed:', error);
    return null;
  }
};

export const signinWithDeviceInfo = async (credentials: {
  nickname: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);
    const deviceInfo = await getDeviceInfo();

    const formData: SigninFormData = {
      ...credentials,
      ...deviceInfo,
    };

    return await signin(formData);
  } catch (error) {
    console.error(error);
    throw new Error(getErrorMessage(error));
  }
};
