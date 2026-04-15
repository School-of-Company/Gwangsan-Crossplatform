import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetMyProfile } from '../useGetMyProfile';
import { useGetProfile } from '../useGetProfile';
import { useGetMyPosts } from '../useGetMyPosts';
import { useGetPosts } from '../useGetPosts';
import { useUpdateProfile } from '../useUpdateProfile';
import { useBlockUser } from '../useBlockUser';
import { useGetBlockList } from '../useGetBlockList';
import { getMyProfile } from '../../api/getMyProfile';
import { getProfile } from '../../api/getProfile';
import { getMyPosts } from '../../api/getMyPosts';
import { getPost } from '../../api/getPosts';
import { updateProfile } from '../../api/updateProfile';
import { blockUser, unblockUser } from '../../api/blockUser';
import { getBlockList } from '../../api/getBlockList';
import Toast from 'react-native-toast-message';

jest.mock('../../api/getMyProfile', () => ({ getMyProfile: jest.fn() }));
jest.mock('../../api/getProfile', () => ({ getProfile: jest.fn() }));
jest.mock('../../api/getMyPosts', () => ({ getMyPosts: jest.fn() }));
jest.mock('../../api/getPosts', () => ({ getPost: jest.fn() }));
jest.mock('../../api/updateProfile', () => ({ updateProfile: jest.fn() }));
jest.mock('../../api/blockUser', () => ({ blockUser: jest.fn(), unblockUser: jest.fn() }));
jest.mock('../../api/getBlockList', () => ({ getBlockList: jest.fn() }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGetMyProfile = getMyProfile as jest.Mock;
const mockGetProfile = getProfile as jest.Mock;
const mockGetMyPosts = getMyPosts as jest.Mock;
const mockGetPost = getPost as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;
const mockBlockUser = blockUser as jest.Mock;
const mockUnblockUser = unblockUser as jest.Mock;
const mockGetBlockList = getBlockList as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useGetMyProfile', () => {
  it('isMe=true이면 쿼리가 활성화된다', async () => {
    mockGetMyProfile.mockResolvedValue({ memberId: 1, nickname: '나' });

    const { result } = renderHookWithProviders(() => useGetMyProfile(true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMyProfile).toHaveBeenCalled();
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
});

describe('useGetProfile', () => {
  it('id가 있으면 getProfile을 호출한다', async () => {
    mockGetProfile.mockResolvedValue({ memberId: 42 });

    const { result } = renderHookWithProviders(() => useGetProfile('42'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetProfile).toHaveBeenCalledWith('42');
  });

  it('id가 null이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetProfile(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useGetMyPosts', () => {
  it('isMe=true이면 getMyPosts를 호출한다', async () => {
    mockGetMyPosts.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetMyPosts(true));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMyPosts).toHaveBeenCalled();
  });

  it('isMe=false이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetMyPosts(false));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useGetPosts', () => {
  it('id가 있으면 getPost를 호출한다', async () => {
    mockGetPost.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGetPosts('5'));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetPost).toHaveBeenCalledWith('5');
  });

  it('id가 null이면 쿼리가 비활성화된다', () => {
    const { result } = renderHookWithProviders(() => useGetPosts(null));

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateProfile', () => {
  const payload = { nickname: '새닉', specialties: [], description: '' };

  it('성공 시 profile 쿼리를 invalidate하고 Toast를 표시한다', async () => {
    mockUpdateProfile.mockResolvedValue({});

    const { result, queryClient } = renderHookWithProviders(() => useUpdateProfile());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('실패 시 에러 Toast를 표시한다', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useUpdateProfile());

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text2: '서버 오류' })
    );
  });
});

describe('useBlockUser', () => {
  it('block 성공 시 blockList를 invalidate하고 Toast를 표시한다', async () => {
    mockBlockUser.mockResolvedValue({});

    const { result, queryClient } = renderHookWithProviders(() => useBlockUser(7));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.block.mutate();
    });

    await waitFor(() => expect(result.current.block.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['blockList'] });
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('targetMemberId가 undefined이면 block mutation이 에러를 던진다', async () => {
    const { result } = renderHookWithProviders(() => useBlockUser(undefined));

    await act(async () => {
      result.current.block.mutate();
    });

    await waitFor(() => expect(result.current.block.isError).toBe(true));
  });

  it('unblock 성공 시 blockList를 invalidate한다', async () => {
    mockUnblockUser.mockResolvedValue({});

    const { result, queryClient } = renderHookWithProviders(() => useBlockUser(7));
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.unblock.mutate();
    });

    await waitFor(() => expect(result.current.unblock.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['blockList'] });
  });
});

describe('useGetBlockList', () => {
  it('getBlockList를 호출하고 데이터를 반환한다', async () => {
    mockGetBlockList.mockResolvedValue([{ memberId: 3, nickname: '차단됨' }]);

    const { result } = renderHookWithProviders(() => useGetBlockList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ memberId: 3, nickname: '차단됨' }]);
  });

  it('queryKey가 [blockList]이다', async () => {
    mockGetBlockList.mockResolvedValue([]);

    const { queryClient } = renderHookWithProviders(() => useGetBlockList());

    await waitFor(() => expect(queryClient.getQueryState(['blockList'])).toBeDefined());
  });
});
