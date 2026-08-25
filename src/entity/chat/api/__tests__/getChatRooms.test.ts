import { getChatRooms } from '../getChatRooms';
import { instance } from '@/shared/lib/axios';
import Toast from 'react-native-toast-message';

jest.mock('@/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

const makeRoom = (overrides: Record<string, unknown> = {}) => ({
  roomId: 1,
  member: { memberId: 2, nickname: '상대방' },
  messageId: 10,
  lastMessage: '안녕하세요',
  lastMessageType: 'TEXT',
  lastMessageTime: '2024-01-01T00:00:00Z',
  unreadMessageCount: 0,
  product: { productId: 1, title: '상품', images: [] },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('getChatRooms', () => {
  describe('성공 케이스', () => {
    it('GET /chat/rooms 요청 후 목록을 반환한다', async () => {
      const rooms = [makeRoom()];
      mockGet.mockResolvedValue({ data: rooms });

      const result = await getChatRooms();

      expect(mockGet).toHaveBeenCalledWith('/chat/rooms');
      expect(result).toEqual(rooms);
    });

    it('빈 목록도 정상적으로 반환한다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getChatRooms();

      expect(result).toEqual([]);
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러를 throw한다', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getChatRooms()).rejects.toThrow('Network error');
    });

    it('폴링 중 토스트가 쌓이지 않도록 실패해도 토스트를 띄우지 않는다', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getChatRooms()).rejects.toThrow('Network error');

      expect(Toast.show).not.toHaveBeenCalled();
    });
  });
});
