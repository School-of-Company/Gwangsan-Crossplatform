import { setData } from '@/shared/lib/setData';
import { getDeviceInfo } from '@/shared/model/getDeviceInfo';
import { SigninFormData, AuthResponse } from '~/shared/types/authState';
import { publicInstance } from '~/shared/lib/publicInstance';
import { toAppError } from '~/shared/lib/errorHandler';
import { logger } from '~/shared/lib/logger';

// 로그인은 기기 정보 수집과 서버 인증이 겹쳐 다른 공개 요청보다 여유 있게 기다린다
const SIGNIN_TIMEOUT_MS = 15_000;

const signin = async (formData: SigninFormData): Promise<AuthResponse> => {
  try {
    const response = await publicInstance.post<AuthResponse>(
      '/auth/signin',
      {
        nickname: formData.nickname,
        password: formData.password,
        deviceToken: formData.deviceToken,
        deviceId: formData.deviceId,
        osType: formData.osType,
      },
      { timeout: SIGNIN_TIMEOUT_MS }
    );

    const { accessToken, refreshToken } = response.data;

    await Promise.all([setData('accessToken', accessToken), setData('refreshToken', refreshToken)]);

    return response.data;
  } catch (error) {
    throw toAppError(error);
  }
};

// 생체 인증 로그인용 키체인 처리는 토큰 재발급(shared/lib/axios)에서도 써야 해서 shared로 옮겼다
export {
  saveCredentialsForBiometric,
  getCredentialsForBiometric,
  clearCredentialsForBiometric,
} from '~/shared/lib/biometricCredentials';

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
