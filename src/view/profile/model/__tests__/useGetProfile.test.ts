import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetProfile } from '../useGetProfile';
import { getProfile } from '../../api/getProfile';

jest.mock('../../api/getProfile', () => ({ getProfile: jest.fn() }));

const mockGetProfile = getProfile as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetProfile', () => {
  it('id가 있으면 getProfile을 호출하고 데이터를 반환한다', async () => {
    mockGetProfile.mockResolvedValue({ memberId: 42 });

    const { result } = renderHookWithProviders(() => useGetProfile('42'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetProfile).toHaveBeenCalledWith('42');
    expect(result.current.data).toEqual({ memberId: 42 });
  });

  it('id가 null이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetProfile(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it('queryKey가 [profile, id]이다', async () => {
    mockGetProfile.mockResolvedValue({});

    const { queryClient } = renderHookWithProviders(() => useGetProfile('42'));

    await waitFor(() => expect(queryClient.getQueryState(['profile', '42'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetProfile.mockRejectedValue(new Error('Not found'));

    const { result } = renderHookWithProviders(() => useGetProfile('99'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Not found');
  });
});
