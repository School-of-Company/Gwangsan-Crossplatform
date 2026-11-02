import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 서버가 상태 코드와 함께 응답한 AxiosError. API 함수가 toAppError로 던진 에러에
// 상태 코드가 남아 QueryProvider의 재시도·ErrorBoundary 정책에 쓰이는지 확인할 때 쓴다.
export const createAxiosError = (status: number, data: unknown = {}): AxiosError => {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
};
