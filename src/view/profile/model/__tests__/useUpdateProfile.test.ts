import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useUpdateProfile } from '../useUpdateProfile';
import { updateProfile } from '../../api/updateProfile';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

jest.mock('../../api/updateProfile', () => ({ updateProfile: jest.fn() }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUpdateProfile = updateProfile as jest.Mock;
const mockRouterBack = router.back as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('useUpdateProfile', () => {
  const payload = { nickname: '새닉', specialties: ['요리'], description: '소개' };

  it('성공 시 profile 쿼리를 invalidate하고 성공 Toast를 표시하고 뒤로 이동한다', async () => {
    mockUpdateProfile.mockResolvedValue({ success: true });

    const { result, queryClient } = renderHookWithProviders(() => useUpdateProfile());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateProfile).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile'] });
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '성공', text2: '프로필이 수정되었습니다.' })
    );
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('실패 시 에러 Toast를 표시하고 뒤로 이동하지 않는다', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useUpdateProfile());

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '오류', text2: '서버 오류' })
    );
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
