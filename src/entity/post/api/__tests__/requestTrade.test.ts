import { requestTrade } from '../requestTrade';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('requestTrade', () => {
  describe('성공 케이스', () => {
    it('POST /post/trade를 올바른 payload로 호출하고 응답 data를 반환한다', async () => {
      const response = { success: true, roomId: 10 };
      mockPost.mockResolvedValue({ data: response });

      const result = await requestTrade({ productId: 1, otherMemberId: 2 });

      expect(mockPost).toHaveBeenCalledWith('/post/trade', { productId: 1, otherMemberId: 2 });
      expect(result).toEqual(response);
    });

    it('다른 파라미터로 호출해도 정상 동작한다', async () => {
      const response = { success: true, roomId: 99 };
      mockPost.mockResolvedValue({ data: response });

      const result = await requestTrade({ productId: 42, otherMemberId: 7 });

      expect(mockPost).toHaveBeenCalledWith('/post/trade', { productId: 42, otherMemberId: 7 });
      expect(result).toEqual(response);
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Bad Request'));

      await expect(requestTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(requestTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow(
        'Server error'
      );
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Network Error'));

      await expect(requestTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow(
        'Network Error'
      );
    });
  });
});
