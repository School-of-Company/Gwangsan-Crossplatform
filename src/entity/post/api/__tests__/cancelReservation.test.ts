import { cancelReservation } from '../cancelReservation';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { delete: jest.fn() },
}));

const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('cancelReservation', () => {
  describe('성공 케이스', () => {
    it('DELETE /post/reservation/:productId를 호출하고 응답 data를 반환한다', async () => {
      const response = { message: '예약이 취소되었습니다.' };
      mockDelete.mockResolvedValue({ data: response });

      const result = await cancelReservation({ productId: 1 });

      expect(mockDelete).toHaveBeenCalledWith('/post/reservation/1');
      expect(result).toEqual(response);
    });

    it('다른 productId로 올바른 경로를 요청한다', async () => {
      mockDelete.mockResolvedValue({ data: {} });

      await cancelReservation({ productId: 42 });

      expect(mockDelete).toHaveBeenCalledWith('/post/reservation/42');
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Not found'));

      await expect(cancelReservation({ productId: 1 })).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockDelete.mockRejectedValue(new Error('Server error'));

      await expect(cancelReservation({ productId: 1 })).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Network Error'));

      await expect(cancelReservation({ productId: 1 })).rejects.toThrow('Network Error');
    });
  });
});
