import { deleteChatRoom } from '../deleteChatRoom';
import { instance } from '@/shared/lib/axios';
import Toast from 'react-native-toast-message';
import { toAppError } from '~/shared/lib/errorHandler';

jest.mock('@/shared/lib/axios', () => ({
  instance: { delete: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/shared/lib/errorHandler', () => ({
  toAppError: jest.fn((error) => error),
}));

const mockDelete = instance.delete as jest.Mock;
const mockToAppError = toAppError as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('deleteChatRoom', () => {
  describe('성공 케이스', () => {
    it('DELETE /chat/room/:roomId 요청을 보낸다', async () => {
      mockDelete.mockResolvedValue({});

      await deleteChatRoom(1);

      expect(mockDelete).toHaveBeenCalledWith('/chat/room/1');
    });

    it('다른 roomId로 올바른 경로를 요청한다', async () => {
      mockDelete.mockResolvedValue({});

      await deleteChatRoom(42);

      expect(mockDelete).toHaveBeenCalledWith('/chat/room/42');
    });
  });

  describe('에러 케이스', () => {
    it('API 실패 시 에러 토스트를 보여주고 에러를 throw한다', async () => {
      mockDelete.mockRejectedValue(new Error('Network error'));

      await expect(deleteChatRoom(1)).rejects.toThrow('Network error');

      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '채팅방 삭제 실패',
          text2: 'Network error',
        })
      );
    });

    it('에러가 toAppError를 통해 래핑된다', async () => {
      const originalError = new Error('Server error');
      const wrappedError = new Error('Wrapped server error');
      mockDelete.mockRejectedValue(originalError);
      mockToAppError.mockReturnValueOnce(wrappedError);

      await expect(deleteChatRoom(1)).rejects.toBe(wrappedError);

      expect(mockToAppError).toHaveBeenCalledWith(originalError);
    });
  });
});
