import { findChatRoom } from '../findChatRoom';
import { instance } from '@/shared/lib/axios';

jest.mock('@/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('findChatRoom', () => {
  describe('성공 케이스', () => {
    it('GET /chat/room/:productId 요청 후 roomId를 반환한다', async () => {
      mockGet.mockResolvedValue({ data: { roomId: 55 } });

      const result = await findChatRoom(1);

      expect(mockGet).toHaveBeenCalledWith('/chat/room/1');
      expect(result).toEqual({ roomId: 55 });
    });

    it('다른 productId로 올바른 경로를 요청한다', async () => {
      mockGet.mockResolvedValue({ data: { roomId: 77 } });

      await findChatRoom(88);

      expect(mockGet).toHaveBeenCalledWith('/chat/room/88');
    });
  });

  describe('에러 케이스', () => {
    it('API 실패(404) 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(findChatRoom(1)).rejects.toThrow('Not found');
    });

    it('에러 메시지가 toAppError를 통해 래핑된다', async () => {
      mockGet.mockRejectedValue(new Error('Server error'));

      await expect(findChatRoom(1)).rejects.toThrow('Server error');
    });
  });
});
