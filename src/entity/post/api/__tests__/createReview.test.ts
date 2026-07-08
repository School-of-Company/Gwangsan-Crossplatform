import { createReview } from '../createReview';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('createReview', () => {
  describe('성공 케이스', () => {
    it('POST /review를 올바른 payload로 호출하고 true를 반환한다', async () => {
      mockPost.mockResolvedValue({});

      const result = await createReview({ productId: 1, content: '좋았어요', light: 80 });

      expect(mockPost).toHaveBeenCalledWith('/review', {
        productId: 1,
        content: '좋았어요',
        light: 80,
      });
      expect(result).toBe(true);
    });

    it('다른 파라미터로 호출해도 정상 동작한다', async () => {
      mockPost.mockResolvedValue({});

      const result = await createReview({ productId: 99, content: '보통이에요', light: 50 });

      expect(mockPost).toHaveBeenCalledWith('/review', {
        productId: 99,
        content: '보통이에요',
        light: 50,
      });
      expect(result).toBe(true);
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Bad Request'));

      await expect(createReview({ productId: 1, content: '내용', light: 80 })).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(createReview({ productId: 1, content: '내용', light: 80 })).rejects.toThrow(
        'Server error'
      );
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Network Error'));

      await expect(createReview({ productId: 1, content: '내용', light: 80 })).rejects.toThrow(
        'Network Error'
      );
    });
  });
});
