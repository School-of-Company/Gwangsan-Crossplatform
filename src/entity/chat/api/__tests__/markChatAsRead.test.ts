import { markChatAsRead } from '../markChatAsRead';
import { instance } from '@/shared/lib/axios';
import Toast from 'react-native-toast-message';

jest.mock('@/shared/lib/axios', () => ({
  instance: { patch: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockPatch = instance.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('markChatAsRead', () => {
  describe('성공 케이스', () => {
    it('PATCH /chat/read 요청을 roomId, lastMessageId와 함께 보낸다', async () => {
      mockPatch.mockResolvedValue({ data: undefined });

      await markChatAsRead(1, 100);

      expect(mockPatch).toHaveBeenCalledWith('/chat/read', {
        roomId: 1,
        lastMessageId: 100,
      });
    });

    it('반환값이 없다', async () => {
      mockPatch.mockResolvedValue({ data: undefined });

      const result = await markChatAsRead(1, 100);

      expect(result).toBeUndefined();
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러 토스트를 보여주고 에러를 throw한다', async () => {
      mockPatch.mockRejectedValue(new Error('Network error'));

      await expect(markChatAsRead(1, 100)).rejects.toThrow('Network error');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '읽음 처리 실패',
          text2: 'Network error',
        })
      );
    });
  });
});
