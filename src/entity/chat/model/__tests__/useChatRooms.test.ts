import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useChatRooms, chatRoomKeys } from '../useChatRooms';
import { getChatRooms } from '../../api/getChatRooms';
import { markChatAsRead } from '../../api/markChatAsRead';
import { useReadRoomsStore } from '~/shared/store/useReadRoomsStore';
import type { ChatRoomListItem } from '../chatTypes';

jest.mock('../../api/getChatRooms', () => ({
  getChatRooms: jest.fn(),
}));

jest.mock('../../api/markChatAsRead', () => ({
  markChatAsRead: jest.fn(),
}));

const mockGetChatRooms = getChatRooms as jest.Mock;
const mockMarkChatAsRead = markChatAsRead as jest.Mock;

const makeRoom = (overrides: Partial<ChatRoomListItem> = {}): ChatRoomListItem => ({
  roomId: 1,
  member: { memberId: 2, nickname: '상대방' },
  messageId: 1,
  lastMessage: '안녕',
  lastMessageType: 'TEXT',
  lastMessageTime: '2024-01-01T00:00:00Z',
  unreadMessageCount: 0,
  product: { productId: 1, title: '상품', images: [] },
  ...overrides,
});

describe('useChatRooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useReadRoomsStore.getState().reset();
    });
  });

  describe('목록 조회', () => {
    it('getChatRooms를 호출하고 데이터를 반환한다', async () => {
      mockGetChatRooms.mockResolvedValue([makeRoom()]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockGetChatRooms).toHaveBeenCalledTimes(1);
      expect(result.current.data).toHaveLength(1);
    });

    it('enabled가 false이면 요청하지 않는다', () => {
      mockGetChatRooms.mockResolvedValue([]);

      renderHookWithProviders(() => useChatRooms({ enabled: false }));

      expect(mockGetChatRooms).not.toHaveBeenCalled();
    });

    it('unreadMessageCount가 있는 방을 먼저 정렬한다', async () => {
      mockGetChatRooms.mockResolvedValue([
        makeRoom({ roomId: 1, unreadMessageCount: 0, lastMessageTime: '2024-01-02T00:00:00Z' }),
        makeRoom({ roomId: 2, unreadMessageCount: 3, lastMessageTime: '2024-01-01T00:00:00Z' }),
      ]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].roomId).toBe(2);
    });

    it('unreadMessageCount가 동일하면 최신 메시지 시간 순으로 정렬한다', async () => {
      mockGetChatRooms.mockResolvedValue([
        makeRoom({ roomId: 1, unreadMessageCount: 0, lastMessageTime: '2024-01-01T00:00:00Z' }),
        makeRoom({ roomId: 2, unreadMessageCount: 0, lastMessageTime: '2024-01-02T00:00:00Z' }),
      ]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].roomId).toBe(2);
    });

    it('lastMessageTime이 없는 방이 섞여 있어도 에러 없이 정렬한다', async () => {
      mockGetChatRooms.mockResolvedValue([
        makeRoom({ roomId: 1, unreadMessageCount: 0, lastMessageTime: '2024-01-01T00:00:00Z' }),
        makeRoom({
          roomId: 2,
          unreadMessageCount: 0,
          lastMessageTime: null as unknown as string,
        }),
      ]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isError).toBe(false);
      expect(result.current.data).toHaveLength(2);
    });

    it('읽음 처리된 방(isRead)은 unreadMessageCount를 0으로 덮어쓴다', async () => {
      act(() => {
        useReadRoomsStore.getState().markRead(1, 5);
      });
      mockGetChatRooms.mockResolvedValue([
        makeRoom({ roomId: 1, messageId: 5, unreadMessageCount: 4 }),
      ]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].unreadMessageCount).toBe(0);
    });

    it('API 에러 발생 시 onError 콜백을 호출한다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('네트워크 오류');
      mockGetChatRooms.mockRejectedValue(error);
      const onError = jest.fn();

      renderHookWithProviders(() => useChatRooms({ onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('totalUnreadCount', () => {
    it('모든 방의 unreadMessageCount 합계를 반환한다', async () => {
      mockGetChatRooms.mockResolvedValue([
        makeRoom({ roomId: 1, unreadMessageCount: 2 }),
        makeRoom({ roomId: 2, unreadMessageCount: 3 }),
      ]);

      const { result } = renderHookWithProviders(() => useChatRooms());

      await waitFor(() => expect(result.current.totalUnreadCount).toBe(5));
    });

    it('데이터가 없으면 0을 반환한다', () => {
      mockGetChatRooms.mockReturnValue(new Promise(() => {}));

      const { result } = renderHookWithProviders(() => useChatRooms());

      expect(result.current.totalUnreadCount).toBe(0);
    });
  });

  describe('invalidateChatRooms', () => {
    it('chatRooms 쿼리를 무효화한다', async () => {
      mockGetChatRooms.mockResolvedValue([makeRoom()]);

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.invalidateChatRooms();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatRoomKeys.list() });
    });
  });

  describe('updateChatRoom', () => {
    it('일치하는 roomId의 방을 updater로 갱신한다', async () => {
      mockGetChatRooms.mockResolvedValue([makeRoom({ roomId: 1, lastMessage: '이전' })]);

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      act(() => {
        result.current.updateChatRoom(1, (room) => ({ ...room, lastMessage: '변경됨' }));
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list());
      expect(rooms?.[0].lastMessage).toBe('변경됨');
    });

    it('캐시 데이터가 없으면 아무 것도 하지 않는다', () => {
      mockGetChatRooms.mockReturnValue(new Promise(() => {}));

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());

      act(() => {
        result.current.updateChatRoom(1, (room) => ({ ...room, lastMessage: '변경됨' }));
      });

      expect(queryClient.getQueryData(chatRoomKeys.list())).toBeUndefined();
    });
  });

  describe('markRoomAsRead', () => {
    it('캐시된 마지막 메시지로 markChatAsRead를 호출한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      mockGetChatRooms.mockResolvedValue([makeRoom({ roomId: 1, unreadMessageCount: 3 })]);

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      queryClient.setQueryData(['chatMessages', 1], [{ messageId: 10 }, { messageId: 20 }]);

      await act(async () => {
        await result.current.markRoomAsRead(1);
      });

      expect(mockMarkChatAsRead).toHaveBeenCalledWith(1, 20);
      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list());
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('캐시된 메시지가 없으면 API를 호출하지 않고 unreadMessageCount를 0으로 만든다', async () => {
      mockGetChatRooms.mockResolvedValue([makeRoom({ roomId: 1, unreadMessageCount: 3 })]);

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(async () => {
        await result.current.markRoomAsRead(1);
      });

      expect(mockMarkChatAsRead).not.toHaveBeenCalled();
      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list());
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('markChatAsRead 실패 시에도 unreadMessageCount를 0으로 만든다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMarkChatAsRead.mockRejectedValue(new Error('실패'));
      mockGetChatRooms.mockResolvedValue([makeRoom({ roomId: 1, unreadMessageCount: 3 })]);

      const { result, queryClient } = renderHookWithProviders(() => useChatRooms());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      queryClient.setQueryData(['chatMessages', 1], [{ messageId: 10 }]);

      await act(async () => {
        await result.current.markRoomAsRead(1);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list());
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });
  });
});
