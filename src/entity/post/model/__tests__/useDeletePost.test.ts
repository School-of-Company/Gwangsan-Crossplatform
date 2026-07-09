import { act, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { renderHookWithProviders, createQueryClient } from '~/test-utils';
import Toast from 'react-native-toast-message';
import { useDeletePost } from '../useDeletePost';
import { deletePost } from '../../api/deletePost';

jest.mock('../../api/deletePost', () => ({
  deletePost: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockDeletePost = deletePost as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('useDeletePost', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ replace: mockReplace });
  });

  describe('초기 상태', () => {
    it('isLoading이 false이고 error가 null이다', () => {
      const { result } = renderHookWithProviders(() => useDeletePost());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.deletePost).toBe('function');
    });
  });

  describe('삭제 성공', () => {
    it('deletePost를 postId로 호출한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(mockDeletePost).toHaveBeenCalled());
      expect(mockDeletePost.mock.calls[0][0]).toBe(1);
    });

    it('성공 Toast를 표시한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success', text1: '게시글 삭제 완료' })
        )
      );
    });

    it('onSuccess 콜백을 호출한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);
      const onSuccess = jest.fn();

      const { result } = renderHookWithProviders(() => useDeletePost({ onSuccess }));

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    });

    it('삭제 후 posts 쿼리를 무효화한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);
      const queryClient = createQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHookWithProviders(() => useDeletePost(), { queryClient });

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['posts'] }));
    });

    it('삭제 성공 시 type과 mode에 맞는 경로로 리다이렉트한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/post?type=OBJECT&mode=GIVER'));
    });

    it('다른 type/mode 조합에 대해 올바른 경로를 생성한다', async () => {
      mockDeletePost.mockResolvedValue(undefined);

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(2, 'SERVICE', 'RECEIVER');
      });

      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith('/post?type=SERVICE&mode=RECEIVER')
      );
    });
  });

  describe('삭제 실패', () => {
    it('실패 시 에러 Toast를 표시한다', async () => {
      mockDeletePost.mockRejectedValue(new Error('삭제 중 문제가 발생했습니다'));

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: '게시글 삭제 실패',
            text2: '삭제 중 문제가 발생했습니다',
          })
        )
      );
    });

    it('실패 시 기본 에러 메시지를 표시한다 (Error 인스턴스가 아닌 경우)', async () => {
      mockDeletePost.mockRejectedValue('알 수 없는 에러');

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text2: '게시글 삭제 중 오류가 발생했습니다.',
          })
        )
      );
    });

    it('실패 시 리다이렉트하지 않는다', async () => {
      mockDeletePost.mockRejectedValue(new Error('실패'));

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('실패 시 error 상태에 에러가 채워진다', async () => {
      mockDeletePost.mockRejectedValue(new Error('실패'));

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(result.current.error).toBeTruthy());
    });
  });

  describe('로딩 상태', () => {
    it('삭제 진행 중 isLoading이 true이다', async () => {
      let resolveDelete!: () => void;
      mockDeletePost.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          })
      );

      const { result } = renderHookWithProviders(() => useDeletePost());

      act(() => {
        result.current.deletePost(1, 'OBJECT', 'GIVER');
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveDelete();
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });
});
