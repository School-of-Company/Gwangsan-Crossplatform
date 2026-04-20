import { getItem } from '../getItem';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

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

describe('getItem', () => {
  describe('성공 케이스', () => {
    it('GET /post/:id 응답 data를 반환한다', async () => {
      const detail = makePostDetail();
      mockGet.mockResolvedValue({ data: detail });

      const result = await getItem('1');

      expect(mockGet).toHaveBeenCalledWith('/post/1');
      expect(result).toEqual(detail);
    });

    it('다른 postId로 올바른 경로를 요청한다', async () => {
      mockGet.mockResolvedValue({ data: makePostDetail({ id: 99 }) });

      await getItem('99');

      expect(mockGet).toHaveBeenCalledWith('/post/99');
    });

    it('images 배열이 비어있는 게시글도 정상 반환한다', async () => {
      const detail = makePostDetail({ images: [] });
      mockGet.mockResolvedValue({ data: detail });

      const result = await getItem('1');

      expect(result.images).toEqual([]);
    });

    it('member 정보를 포함한 응답을 반환한다', async () => {
      const detail = makePostDetail();
      mockGet.mockResolvedValue({ data: detail });

      const result = await getItem('1');

      expect(result.member).toEqual({
        memberId: 42,
        nickname: '홍길동',
        placeName: '광산구',
        light: 80,
      });
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(getItem('999')).rejects.toThrow();
    });

    it('에러 메시지가 getErrorMessage를 통해 래핑된다', async () => {
      mockGet.mockRejectedValue(new Error('Server error'));

      await expect(getItem('1')).rejects.toThrow(Error);
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getItem('1')).rejects.toThrow('Network Error');
    });
  });
});
