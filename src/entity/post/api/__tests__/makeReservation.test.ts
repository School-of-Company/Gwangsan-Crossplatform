import { makeReservation } from '../makeReservation';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { patch: jest.fn() },
}));

const mockPatch = instance.patch as jest.Mock;

const baseRequest = {
  productId: 1,
  roomId: 10,
  scheduledAt: '2026-08-27T14:30:00',
  placeName: '상무역 2번 출구',
  address: '광주 서구 상무자유로',
  latitude: 35.15,
  longitude: 126.85,
};

beforeEach(() => jest.clearAllMocks());

describe('makeReservation', () => {
  describe('성공 케이스', () => {
    it('PATCH /post/reservation/:productId를 예약 정보와 함께 호출한다', async () => {
      mockPatch.mockResolvedValue({ data: {} });

      await makeReservation(baseRequest);

      expect(mockPatch).toHaveBeenCalledWith('/post/reservation/1', {
        roomId: 10,
        scheduledAt: '2026-08-27T14:30:00',
        placeName: '상무역 2번 출구',
        address: '광주 서구 상무자유로',
        latitude: 35.15,
        longitude: 126.85,
      });
    });

    it('다른 productId로 올바른 경로를 요청한다', async () => {
      mockPatch.mockResolvedValue({ data: {} });

      await makeReservation({ ...baseRequest, productId: 42 });

      expect(mockPatch).toHaveBeenCalledWith('/post/reservation/42', expect.any(Object));
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Conflict'));

      await expect(makeReservation(baseRequest)).rejects.toThrow();
    });

    it('에러 메시지가 전파된다', async () => {
      mockPatch.mockRejectedValue(new Error('Server error'));

      await expect(makeReservation(baseRequest)).rejects.toThrow('Server error');
    });

    it('네트워크 에러 시 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Network Error'));

      await expect(makeReservation(baseRequest)).rejects.toThrow('Network Error');
    });
  });
});
