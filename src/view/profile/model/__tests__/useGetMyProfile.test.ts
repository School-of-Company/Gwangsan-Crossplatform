import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetMyProfile } from '../useGetMyProfile';
import { getMyProfile } from '../../api/getMyProfile';

jest.mock('../../api/getMyProfile', () => ({ getMyProfile: jest.fn() }));

const mockGetMyProfile = getMyProfile as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetMyProfile', () => {
  it('isMe=true이면 쿼리가 활성화되고 데이터를 반환한다', async () => {
    mockGetMyProfile.mockResolvedValue({ memberId: 1, nickname: '나' });

    const { result } = renderHookWithProviders(() => useGetMyProfile(true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMyProfile).toHaveBeenCalled();
    expect(result.current.data).toEqual({ memberId: 1, nickname: '나' });
  });

  it('isMe=false이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetMyProfile(false));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetMyProfile).not.toHaveBeenCalled();
  });

  it('queryKey가 [myProfile, current]이다', async () => {
    mockGetMyProfile.mockResolvedValue({});

    const { queryClient } = renderHookWithProviders(() => useGetMyProfile(true));

    await waitFor(() => expect(queryClient.getQueryState(['myProfile', 'current'])).toBeDefined());
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('실패'));

    const { result } = renderHookWithProviders(() => useGetMyProfile(true));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('실패');
  });
});
