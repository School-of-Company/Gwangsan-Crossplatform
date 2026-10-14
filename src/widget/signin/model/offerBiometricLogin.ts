import { Alert } from 'react-native';
import {
  getBiometricPreference,
  isBiometricSupported,
  saveCredentialsForBiometric,
  setBiometricPreference,
} from '~/shared/lib/biometricCredentials';

// 비밀번호로 로그인한 직후 호출한다.
// - 이미 켜 둔 사용자: 새 토큰으로 생체 인증 사본을 갱신한다
// - 아직 묻지 않은 사용자: 켤지 물어보고, 동의한 경우에만 저장한다
// - 끈 사용자 / 기기가 지원하지 않음: 아무것도 하지 않는다
export const offerBiometricLogin = async (accessToken: string, refreshToken: string) => {
  const preference = await getBiometricPreference();

  if (preference === true) {
    await saveCredentialsForBiometric(accessToken, refreshToken);
    return;
  }
  if (preference === false || !(await isBiometricSupported())) return;

  Alert.alert('생체 인증 로그인', '다음부터 Face ID나 지문으로 바로 로그인할까요?', [
    {
      text: '사용 안 함',
      style: 'cancel',
      onPress: () => {
        setBiometricPreference(false).catch(() => {});
      },
    },
    {
      text: '사용',
      onPress: () => {
        setBiometricPreference(true)
          .then(() => saveCredentialsForBiometric(accessToken, refreshToken))
          .catch(() => {});
      },
    },
  ]);
};
