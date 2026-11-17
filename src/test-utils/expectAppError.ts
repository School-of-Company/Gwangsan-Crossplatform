import { AxiosError } from 'axios';

// toAppError를 거친 에러가 AxiosError(상태 코드 유지)이고, 사용자용 메시지를 담고 있는지 검증한다.
// QueryProvider의 재시도·ErrorBoundary 판단이 response.status에 의존하므로 상태 코드도 함께 본다.
export const expectAppError = async (
  promise: Promise<unknown>,
  status: number,
  message?: string
): Promise<unknown> => {
  const error = await promise.catch((e: unknown) => e);

  expect(error).toBeInstanceOf(AxiosError);
  expect((error as AxiosError).response?.status).toBe(status);
  if (message !== undefined) expect((error as Error).message).toBe(message);
  return error;
};
