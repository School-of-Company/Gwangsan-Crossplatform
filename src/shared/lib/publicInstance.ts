import axios from 'axios';
import { API_BASE_URL } from '~/shared/consts/api';

// 로그인 전(인증 토큰이 필요 없는) 요청용 axios 인스턴스. SMS 인증, 비밀번호 재설정, 로그인 등.
// 예전에는 raw fetch를 써서 타임아웃이 없었고, 응답 파싱·에러 메시지 처리가 파일마다 중복됐다(#739).
// 토큰 재발급 인터셉터가 없는 대신 에러는 AxiosError로 던져 getErrorMessage/toAppError를 그대로 쓴다.
export const PUBLIC_REQUEST_TIMEOUT_MS = 10_000;

export const publicInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: PUBLIC_REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});
