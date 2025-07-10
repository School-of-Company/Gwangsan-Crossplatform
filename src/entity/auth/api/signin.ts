import { instance } from '@/shared/lib/aixos';
import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { SigninFormData, AuthResponse } from '~/entity/auth/model/authState';

const signin = async (formData: SigninFormData): Promise<AuthResponse> => {
  try {
    const response = await instance.post<AuthResponse>('/api/auth/signin', {
      nickname: formData.nickname,
      password: formData.password,
      deviceToken: formData.deviceToken,
      deviceId: formData.deviceId,
      osType: formData.osType,
    });

    const { accessToken, refreshToken, accessTokenExpiresIn, refreshTokenExpiresIn } = response.data;

    await Promise.all([
      setData('accessToken', accessToken),
      setData('refreshToken', refreshToken),
      setData('accessTokenExpiresIn', accessTokenExpiresIn),
      setData('refreshTokenExpiresIn', refreshTokenExpiresIn),
    ]);

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const signinWithDeviceInfo = async (
  credentials: { nickname: string; password: string }
): Promise<AuthResponse> => {
  try {
    const deviceInfo = await getDeviceInfo();
    
    const formData: SigninFormData = {
      ...credentials,
      ...deviceInfo,
    };

    return await signin(formData);
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};
