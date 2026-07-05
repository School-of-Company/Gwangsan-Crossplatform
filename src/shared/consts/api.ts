import { API_URL } from '@env';

// env(API_URL)가 빌드에 주입되지 않은 경우(예: EAS 빌드에 env 미등록)에도
// 동작하도록 프로덕션 API 주소를 폴백으로 사용한다.
export const API_BASE_URL: string = API_URL ?? 'https://api.gwangsan.io.kr/api';
