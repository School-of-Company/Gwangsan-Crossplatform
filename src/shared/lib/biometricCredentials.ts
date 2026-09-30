import * as Keychain from 'react-native-keychain';
import { getData } from './getData';
import { setData } from './setData';
import { logger } from './logger';

// 사용자가 생체 인증 로그인을 켰는지 여부. 동의한 경우에만 토큰을 생체 인증 키체인에 저장한다(#737)
const BIOMETRIC_PREFERENCE_KEY = 'biometricLoginEnabled';

const AUTHENTICATION_PROMPT = { title: '생체 인증으로 로그인', cancel: '취소' };

// true: 사용, false: 사용 안 함, null: 아직 묻지 않음
export const getBiometricPreference = async (): Promise<boolean | null> => {
  try {
    const value = await getData(BIOMETRIC_PREFERENCE_KEY);
    return value === null ? null : value === 'true';
  } catch (error) {
    logger.warn('Failed to read biometric preference', error);
    return null;
  }
};

export const setBiometricPreference = async (enabled: boolean): Promise<void> => {
  await setData(BIOMETRIC_PREFERENCE_KEY, String(enabled));
};

export const isBiometricSupported = async (): Promise<boolean> => {
  try {
    return !!(await Keychain.getSupportedBiometryType());
  } catch {
    return false;
  }
};

export const saveCredentialsForBiometric = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    if (!(await isBiometricSupported())) return;

    await Keychain.setGenericPassword(accessToken, refreshToken, {
      // 지문·얼굴이 새로 등록되면 저장된 항목을 쓸 수 없게 해, 다른 사람이 생체 정보를 추가해
      // 로그인하는 것을 막는다. BIOMETRY_ANY는 새로 등록해도 계속 통과한다
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      authenticationPrompt: { title: AUTHENTICATION_PROMPT.title },
    });
  } catch (error) {
    logger.error('Failed to save tokens for biometric auth', error);
  }
};

export const getCredentialsForBiometric = async (): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> => {
  // 동의하지 않은 사용자에게는 생체 인증 창을 띄우지 않는다
  if ((await getBiometricPreference()) !== true) return null;

  try {
    const result = await Keychain.getGenericPassword({
      authenticationPrompt: AUTHENTICATION_PROMPT,
    });

    if (!result) return null;

    return { accessToken: result.username, refreshToken: result.password };
  } catch (error) {
    logger.error('Biometric auth failed', error);
    return null;
  }
};

export const clearCredentialsForBiometric = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword();
  } catch (error) {
    logger.error('Failed to clear biometric credentials', error);
  }
};

// 토큰이 재발급되면 생체 인증용 사본도 새 토큰으로 바꾼다. 그대로 두면 다음 생체 로그인에서
// 이미 폐기된 토큰이 다시 저장되어 곧바로 세션이 만료된다(#737)
export const syncBiometricCredentials = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  if ((await getBiometricPreference()) !== true) return;
  await saveCredentialsForBiometric(accessToken, refreshToken);
};
