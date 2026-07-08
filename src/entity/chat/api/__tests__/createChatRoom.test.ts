import { createChatRoom } from '../createChatRoom';
import { instance } from '@/shared/lib/axios';
import Toast from 'react-native-toast-message';

jest.mock('@/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('createChatRoom', () => {
  describe('성공 케이스', () => {
    it('POST /chat/room/:productId 요청 후 roomId를 반환한다', async () => {
      mockPost.mockResolvedValue({ data: { roomId: 123 } });

      const result = await createChatRoom(1);

      expect(mockPost).toHaveBeenCalledWith('/chat/room/1');
      expect(result).toEqual({ roomId: 123 });
    });

    it('다른 productId로 올바른 경로를 요청한다', async () => {
      mockPost.mockResolvedValue({ data: { roomId: 999 } });

      await createChatRoom(42);

      expect(mockPost).toHaveBeenCalledWith('/chat/room/42');
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러 토스트를 보여주고 에러를 throw한다', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(createChatRoom(1)).rejects.toThrow('Network error');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '채팅방 생성 실패',
          text2: 'Network error',
        })
      );
    });

    it('에러 메시지가 toAppError를 통해 래핑된다', async () => {
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(createChatRoom(1)).rejects.toThrow('Server error');
    });
  });
});
