import { withdrawTrade } from '../withdrawTrade';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { delete: jest.fn() },
}));

const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('withdrawTrade', () => {
  describe('성공 케이스', () => {
    it('DELETE /post/trade를 올바른 payload로 호출한다', async () => {
      mockDelete.mockResolvedValue({ data: undefined });

      await withdrawTrade({ productId: 1, otherMemberId: 2 });

      expect(mockDelete).toHaveBeenCalledWith('/post/trade', {
        data: { productId: 1, otherMemberId: 2 },
      });
    });

    it('다른 파라미터로 호출해도 정상 동작한다', async () => {
      mockDelete.mockResolvedValue({ data: undefined });

      await withdrawTrade({ productId: 42, otherMemberId: 7 });

      expect(mockDelete).toHaveBeenCalledWith('/post/trade', {
        data: { productId: 42, otherMemberId: 7 },
      });
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Not found'));

      await expect(withdrawTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockDelete.mockRejectedValue(new Error('거래 완료 요청자가 아닙니다.'));

      await expect(withdrawTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow(
        '거래 완료 요청자가 아닙니다.'
      );
    });
  });
});
