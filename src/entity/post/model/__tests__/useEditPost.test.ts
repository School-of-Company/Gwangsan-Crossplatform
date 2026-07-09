import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders, createQueryClient } from '~/test-utils';
import Toast from 'react-native-toast-message';
import { useEditPost } from '../useEditPost';
import { editPost } from '../../api/editPost';

jest.mock('../../api/editPost', () => ({
  editPost: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockEditPost = editPost as jest.Mock;

const makeEditData = (overrides: Record<string, unknown> = {}) => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '수정된 제목',
  content: '수정된 내용',
  gwangsan: 1,
  imageIds: [1, 2],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useEditPost', () => {
  describe('초기 상태', () => {
    it('mutate 함수를 제공한다', () => {
      const { result } = renderHookWithProviders(() => useEditPost());

      expect(typeof result.current.mutate).toBe('function');
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('수정 성공', () => {
    it('editPost를 id와 data로 호출한다', async () => {
      mockEditPost.mockResolvedValue({});
      const data = makeEditData();

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data });
      });

      await waitFor(() => expect(mockEditPost).toHaveBeenCalledWith('1', data));
    });

    it('성공 Toast를 표시한다', async () => {
      mockEditPost.mockResolvedValue({});

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'success', text1: '수정 완료' })
        )
      );
    });

    it('성공 시 post와 posts 쿼리를 무효화한다', async () => {
      mockEditPost.mockResolvedValue({});
      const queryClient = createQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHookWithProviders(() => useEditPost(), { queryClient });

      act(() => {
        result.current.mutate({ id: '5', data: makeEditData() });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['post', '5'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['posts'] });
      });
    });

    it('수정 완료 후 isSuccess가 true이다', async () => {
      mockEditPost.mockResolvedValue({});

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('수정 실패', () => {
    it('실패 시 에러 Toast를 표시한다', async () => {
      mockEditPost.mockRejectedValue(new Error('수정 중 문제가 발생했습니다'));

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: '수정 실패',
            text2: '수정 중 문제가 발생했습니다',
          })
        )
      );
    });

    it('실패 시 기본 에러 메시지를 표시한다 (Error 인스턴스가 아닌 경우)', async () => {
      mockEditPost.mockRejectedValue('알 수 없는 에러');

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() =>
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text2: '거래글 수정 중 오류가 발생했습니다.',
          })
        )
      );
    });

    it('실패 시 isError가 true가 된다', async () => {
      mockEditPost.mockRejectedValue(new Error('실패'));

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('로딩 상태', () => {
    it('수정 진행 중 isPending이 true이다', async () => {
      let resolveEdit!: (value: unknown) => void;
      mockEditPost.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveEdit = resolve;
          })
      );

      const { result } = renderHookWithProviders(() => useEditPost());

      act(() => {
        result.current.mutate({ id: '1', data: makeEditData() });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      await act(async () => {
        resolveEdit({});
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
    });
  });
});
