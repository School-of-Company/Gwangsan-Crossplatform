import axios from 'axios';
import Constants from 'expo-constants';

// 인터셉터는 axios.ts가 이 객체에 붙인다. 소켓의 토큰 재발급(tokenRefresh)이 axios.ts를 import하면
// axios → clearSession → sessionCleanup → socket → axios 순환이 생기므로 인스턴스만 따로 둔다.
// 앱 코드는 이 파일 대신 '~/shared/lib/axios'의 instance를 쓴다

// env(API_URL)가 빌드에 주입되지 않은 경우(예: EAS 빌드에 env 미등록)에도
// 동작하도록 프로덕션 API 주소를 폴백으로 사용한다.
const FALLBACK_API_URL = 'https://api.gwangsan.io.kr/api';

export const baseURL: string = Constants.expoConfig?.extra?.apiUrl ?? FALLBACK_API_URL;

export const instance = axios.create({
  baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});
