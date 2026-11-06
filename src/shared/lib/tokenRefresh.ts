import * as Sentry from '@sentry/react-native';
import { instance } from './apiInstance';
import { getRefreshToken } from './auth';
import { setData } from './setData';
import { syncBiometricCredentials } from './biometricCredentials';
import { logger } from './logger';
import { isNetworkOrTimeoutError } from './errorHandler';
import { SessionExpiredError, TokenStorageError } from './authErrors';

export { SessionExpiredError, TokenStorageError };

export const readToken = async (read: () => Promise<string | null>) => {
  try {
    return await read();
  } catch (error) {
    throw new TokenStorageError(error);
  }
};

let refreshPromise: Promise<string> | null = null;

/**
 * 액세스 토큰을 재발급한다. axios 401과 소켓 인증 거부가 동시에 와도 재발급은 한 번만 나간다.
 * 실패 시 TokenStorageError·네트워크 오류는 그대로, 그 밖에는 SessionExpiredError로 던진다
 */
export const refreshAccessToken = (reason: string): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  const promise = (async () => {
    Sentry.addBreadcrumb({
      category: 'auth',
      message: `${reason}, attempting token refresh`,
      level: 'warning',
    });

    const refreshToken = await readToken(getRefreshToken);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await instance.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/reissue',
      { refreshToken }
    );

    const { accessToken: newAccessToken, refreshToken: rotatedRefreshToken } = response.data;
    // 서버가 refresh token을 교체해 내려주면 함께 저장한다. 예전 값을 계속 쓰면 다음 재발급이
    // 실패해 강제 로그아웃된다
    await Promise.all([
      setData('accessToken', newAccessToken),
      rotatedRefreshToken ? setData('refreshToken', rotatedRefreshToken) : Promise.resolve(),
    ]);
    // 생체 인증용 사본 갱신이 실패해도 요청 재시도는 막지 않는다
    syncBiometricCredentials(newAccessToken, rotatedRefreshToken ?? refreshToken).catch((error) =>
      logger.warn('Failed to sync biometric credentials', error)
    );
    return newAccessToken;
  })().catch((error: unknown) => {
    // 기다리던 요청들도 같은 에러를 받으므로, 로그아웃할 상황이면 한국어 안내로 바꿔 던진다
    if (error instanceof TokenStorageError || isNetworkOrTimeoutError(error)) throw error;
    throw new SessionExpiredError(error);
  });

  refreshPromise = promise;
  const release = () => {
    if (refreshPromise === promise) refreshPromise = null;
  };
  promise.then(release, release);
  return promise;
};
