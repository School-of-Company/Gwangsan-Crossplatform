import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import Toast from 'react-native-toast-message';
import { useCreateItem } from '../useCreateItem';
import { createItem } from '../../api/createItem';
import { ItemFormRequestBody } from '../itemFormSchema';
import { PostType } from '~/shared/types/postType';

jest.mock('../../api/createItem', () => ({
  createItem: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockCreateItem = createItem as jest.Mock;

const makeRequestBody = (overrides: Partial<ItemFormRequestBody> = {}): ItemFormRequestBody => ({
  type: 'OBJECT',
  mode: 'GIVER',
  title: '제목',
  content: '내용',
  gwangsan: 10,
  ...overrides,
});

const makePost = (overrides: Partial<PostType> = {}): PostType => ({
  id: 1,
  type: 'OBJECT',
  mode: 'GIVER',
  title: '기존 게시글',
  content: '기존 내용',
  gwangsan: 5,
  isCompletable: false,
  isCompleted: false,
  isReserved: false,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useCreateItem', () => {
  it('성공 시 createItem을 호출하고 posts 캐시를 무효화한다', async () => {
    const body = makeRequestBody();
    mockCreateItem.mockResolvedValue({ id: 1 });

    const { result, queryClient } = renderHookWithProviders(() => useCreateItem());
    jest.spyOn(queryClient, 'invalidateQueries');

    await act(async () => {
      await result.current.mutateAsync(body);
    });

    expect(mockCreateItem).toHaveBeenCalledWith(body);
    await waitFor(() =>
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['posts', body.mode, body.type],
      })
    );
  });

  it('성공 시 성공 Toast를 표시한다', async () => {
    mockCreateItem.mockResolvedValue({ id: 1 });
    const body = makeRequestBody();

    const { result } = renderHookWithProviders(() => useCreateItem());

    await act(async () => {
      await result.current.mutateAsync(body);
    });

    await waitFor(() =>
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '등록 완료' })
      )
    );
  });

  it('onMutate 시 기존 캐시가 있으면 낙관적으로 새 항목을 앞에 추가한다', async () => {
    mockCreateItem.mockImplementation(() => new Promise(() => {}));
    const body = makeRequestBody();
    const existingPosts = [makePost()];

    const { result, queryClient } = renderHookWithProviders(() => useCreateItem());
    queryClient.setQueryData(['posts', body.mode, body.type], existingPosts);

    act(() => {
      result.current.mutate(body);
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData<PostType[]>(['posts', body.mode, body.type]);
      expect(cache).toHaveLength(2);
      expect(cache?.[0].title).toBe(body.title);
    });
  });

  it('실패 시 캐시를 이전 상태로 롤백하고 에러 Toast를 표시한다', async () => {
    const body = makeRequestBody();
    const existingPosts = [makePost()];
    mockCreateItem.mockRejectedValue(new Error('등록 실패'));

    const { result, queryClient } = renderHookWithProviders(() => useCreateItem());
    queryClient.setQueryData(['posts', body.mode, body.type], existingPosts);

    await act(async () => {
      try {
        await result.current.mutateAsync(body);
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData<PostType[]>(['posts', body.mode, body.type]);
      expect(cache).toEqual(existingPosts);
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '등록 실패' })
    );
  });

  it('실패 시 에러 메시지를 Toast에 포함한다', async () => {
    const body = makeRequestBody();
    mockCreateItem.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useCreateItem());

    await act(async () => {
      try {
        await result.current.mutateAsync(body);
      } catch {
        // expected
      }
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '등록 실패', text2: '서버 오류' })
    );
  });

  it('Error 인스턴스가 아닌 값으로 실패해도 기본 에러 메시지를 표시한다', async () => {
    const body = makeRequestBody();
    mockCreateItem.mockRejectedValue('문자열 에러');

    const { result } = renderHookWithProviders(() => useCreateItem());

    await act(async () => {
      try {
        await result.current.mutateAsync(body);
      } catch {
        // expected
      }
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: '등록 실패',
        text2: '거래글 등록 중 오류가 발생했습니다.',
      })
    );
  });

  it('기존 캐시가 없으면 실패해도 캐시 롤백을 시도하지 않는다', async () => {
    const body = makeRequestBody();
    mockCreateItem.mockRejectedValue(new Error('등록 실패'));

    const { result, queryClient } = renderHookWithProviders(() => useCreateItem());
    const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

    await act(async () => {
      try {
        await result.current.mutateAsync(body);
      } catch {
        // expected
      }
    });

    expect(setQueryDataSpy).not.toHaveBeenCalledWith(
      ['posts', body.mode, body.type],
      expect.anything()
    );
  });
});
