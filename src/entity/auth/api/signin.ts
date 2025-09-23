import { instance } from '@/shared/lib/axios';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { SigninFormData, AuthResponse } from '~/entity/auth/model/authState';
import axios from 'axios';
import { removeData } from '@/shared/lib/removeData';
import { getErrorMessage } from '~/shared/lib/errorHandler';

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
