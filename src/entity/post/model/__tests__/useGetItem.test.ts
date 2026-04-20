import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useGetItem } from '../useGetItem';
import { getItem } from '../../api/getItem';

jest.mock('../../api/getItem', () => ({
  getItem: jest.fn(),
}));

const mockGetItem = getItem as jest.Mock;

const makePostDetail = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '상세 게시글',
  content: '상세 내용',
  gwangsan: 1,
  type: 'OBJECT',
  mode: 'GIVER',
  images: [{ imageId: 1, imageUrl: 'https://example.com/img.jpg' }],
  isCompletable: true,
  isCompleted: false,
  member: {
    memberId: 42,
    nickname: '홍길동',
    placeName: '광산구',
    light: 80,
  },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('useGetItem', () => {
  describe('데이터 로딩', () => {
    it('postId가 있으면 getItem을 호출하고 데이터를 반환한다', async () => {
      const detail = makePostDetail();
      mockGetItem.mockResolvedValue(detail);

      const { result } = renderHookWithProviders(() => useGetItem('1'));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetItem).toHaveBeenCalledWith('1');
      expect(result.current.data).toEqual(detail);
    });

    it('postId가 undefined이면 쿼리가 비활성화된다', () => {
      const { result } = renderHookWithProviders(() => useGetItem(undefined));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it('postId가 빈 문자열이면 쿼리가 비활성화된다', () => {
      const { result } = renderHookWithProviders(() => useGetItem(''));

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetItem).not.toHaveBeenCalled();
    });
  });

  describe('쿼리 키', () => {
    it('queryKey가 [post, postId] 형태이다', async () => {
      mockGetItem.mockResolvedValue(makePostDetail());

      const { queryClient } = renderHookWithProviders(() => useGetItem('5'));

      await waitFor(() => expect(queryClient.getQueryState(['post', '5'])).toBeDefined());
    });

    it('다른 postId에 대해 별도 캐시 항목을 생성한다', async () => {
      mockGetItem.mockResolvedValue(makePostDetail());

      const { queryClient } = renderHookWithProviders(() => useGetItem('10'));

      await waitFor(() => expect(queryClient.getQueryState(['post', '10'])).toBeDefined());
      expect(queryClient.getQueryState(['post', '5'])).toBeUndefined();
    });
  });

  describe('에러 상태', () => {
    it('API 실패 시 error 상태가 된다', async () => {
      mockGetItem.mockRejectedValue(new Error('Not found'));

      const { result } = renderHookWithProviders(() => useGetItem('999'));

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('로딩 상태', () => {
    it('초기에 isLoading이 true이다', () => {
      mockGetItem.mockReturnValue(new Promise(() => {})); // never resolves

      const { result } = renderHookWithProviders(() => useGetItem('1'));

      expect(result.current.isLoading).toBe(true);
    });
  });
});
