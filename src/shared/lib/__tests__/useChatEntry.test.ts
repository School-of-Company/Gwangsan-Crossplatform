import { act, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useChatEntry } from '../useChatEntry';

import { findChatRoom, createChatRoom } from '@/entity/chat';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

jest.mock('@/entity/chat', () => ({
  findChatRoom: jest.fn(),
  createChatRoom: jest.fn(),
}));

const mockFindChatRoom = findChatRoom as jest.Mock;
const mockCreateChatRoom = createChatRoom as jest.Mock;
const mockToast = Toast as jest.Mocked<typeof Toast>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useChatEntry', () => {
  describe('navigateToChat', () => {
    it('채팅방이 존재하면 해당 방으로 이동한다', async () => {
      mockFindChatRoom.mockResolvedValue({ roomId: 42 });

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.navigateToChat(1 as any);
      });

      expect(mockPush).toHaveBeenCalledWith('/chatting/42');
    });

    it('채팅방이 없으면 새로 생성하고 이동한다', async () => {
      mockFindChatRoom.mockRejectedValue(new Error('해당하는 채팅방을 찾을 수 없습니다.'));
      mockCreateChatRoom.mockResolvedValue({ roomId: 99 });

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.navigateToChat(1 as any);
      });

      expect(mockCreateChatRoom).toHaveBeenCalledWith(1);
      expect(mockPush).toHaveBeenCalledWith('/chatting/99');
    });

    it('채팅방 생성도 실패하면 Toast 에러를 표시한다', async () => {
      mockFindChatRoom.mockRejectedValue(new Error('해당하는 채팅방을 찾을 수 없습니다.'));
      mockCreateChatRoom.mockRejectedValue(new Error('채팅방 생성 실패'));

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.navigateToChat(1 as any);
      });

      expect(mockToast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'create error' })
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('채팅방 조회 중 다른 에러가 발생하면 Toast 에러를 표시한다', async () => {
      mockFindChatRoom.mockRejectedValue(new Error('서버 오류'));

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.navigateToChat(1 as any);
      });

      expect(mockToast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
      expect(mockCreateChatRoom).not.toHaveBeenCalled();
    });
  });

  describe('isLoading', () => {
    it('초기 isLoading은 false이다', () => {
      const { result } = renderHookWithProviders(() => useChatEntry());

      expect(result.current.isLoading).toBe(false);
    });

    it('navigateToChat 완료 후 isLoading이 false로 돌아온다', async () => {
      mockFindChatRoom.mockResolvedValue({ roomId: 1 });

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.navigateToChat(1 as any);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
