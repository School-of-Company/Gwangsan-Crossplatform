import { makeReservation } from '../makeReservation';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { patch: jest.fn() },
}));

const mockPatch = instance.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('makeReservation', () => {
  describe('성공 케이스', () => {
    it('PATCH /post/reservation/:productId를 호출하고 응답 data를 반환한다', async () => {
      const response = { message: '예약이 완료되었습니다.' };
      mockPatch.mockResolvedValue({ data: response });

      const result = await makeReservation({ productId: 1 });

      expect(mockPatch).toHaveBeenCalledWith('/post/reservation/1');
      expect(result).toEqual(response);
    });

    it('다른 productId로 올바른 경로를 요청한다', async () => {
      mockPatch.mockResolvedValue({ data: {} });

      await makeReservation({ productId: 42 });

      expect(mockPatch).toHaveBeenCalledWith('/post/reservation/42');
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Conflict'));

      await expect(makeReservation({ productId: 1 })).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockPatch.mockRejectedValue(new Error('Server error'));

      await expect(makeReservation({ productId: 1 })).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Network Error'));

      await expect(makeReservation({ productId: 1 })).rejects.toThrow('Network Error');
    });
  });
});
