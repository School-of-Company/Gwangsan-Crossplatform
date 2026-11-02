import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { shouldRetryQuery, shouldThrowQueryError } from '~/shared/lib/QueryProvider';
import { createAxiosError } from '~/test-utils/axiosError';
import { getAppVersion } from '../getAppVersion';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getAppVersion', () => {
  it('GET /app/version에 platform을 쿼리로 보내고 응답 data를 반환한다', async () => {
    const version = { latestVersion: '1.2.0', minimumVersion: '1.0.0' };
    mockGet.mockResolvedValue({ data: version });

    const result = await getAppVersion('ios');

    expect(mockGet).toHaveBeenCalledWith('/app/version', { params: { platform: 'ios' } });
    expect(result).toEqual(version);
  });

  it('4xx는 상태 코드를 유지한 채 던져 재시도하지 않는다', async () => {
    mockGet.mockRejectedValue(createAxiosError(400, { message: '지원하지 않는 플랫폼입니다.' }));

    const error = await getAppVersion('web').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(400);
    expect((error as Error).message).toBe('지원하지 않는 플랫폼입니다.');
    expect(shouldRetryQuery(0, error)).toBe(false);
    expect(shouldThrowQueryError(error, false)).toBe(false);
  });

  it('5xx는 캐시가 없으면 ErrorBoundary 정책 대상이 된다', async () => {
    mockGet.mockRejectedValue(createAxiosError(500));

    const error = await getAppVersion('ios').catch((e: unknown) => e);

    expect(shouldThrowQueryError(error, false)).toBe(true);
  });
});
