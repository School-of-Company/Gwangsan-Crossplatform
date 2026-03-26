import { act } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useMessageSync } from '../useMessageSync';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import { markChatAsRead } from '../../api/markChatAsRead';
import type { ChatMessageResponse, ChatRoomListItem } from '../chatTypes';
import type { QueryClient } from '@tanstack/react-query';

jest.mock('../../api/markChatAsRead', () => ({
  markChatAsRead: jest.fn(),
}));

jest.mock('~/shared/store/useChatQueueStore', () => ({
  useChatQueueStore: {
    getState: jest.fn(),
  },
}));

const mockMarkChatAsRead = markChatAsRead as jest.Mock;
const mockGetState = useChatQueueStore.getState as jest.Mock;

const ROOM_ID = 100;
const CHAT_ROOM_KEY = ['chatRooms'];
const CHAT_MSG_KEY = ['chatMessages', ROOM_ID];

const makeMessage = (overrides: Partial<ChatMessageResponse> = {}): ChatMessageResponse => ({
  messageId: 1,
  roomId: ROOM_ID,
  content: '안녕',
  messageType: 'TEXT',
  createdAt: '2024-01-01T10:00:00Z',
  senderNickname: '상대방',
  senderId: 99,
  checked: false,
  isMine: false,
  ...overrides,
});

const makeRoomListItem = (overrides: Partial<ChatRoomListItem> = {}): ChatRoomListItem => ({
  roomId: ROOM_ID,
  member: { memberId: 99, nickname: '상대방' },
  messageId: 1,
  lastMessage: '이전 메시지',
  lastMessageType: 'TEXT',
  lastMessageTime: '2024-01-01T09:00:00Z',
  unreadMessageCount: 2,
  product: { productId: 1, title: '상품', images: [] },
  ...overrides,
});

const setupPendingMessages = (messages: unknown[] = []) => {
  mockGetState.mockReturnValue({
    pendingMessages: messages,
    removeMessage: jest.fn(),
  });
};

describe('useMessageSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPendingMessages();
  });

  const renderSync = (queryClient?: QueryClient) => {
    const options = queryClient ? { queryClient } : {};
    return renderHookWithProviders(
      () =>
        useMessageSync({
          currentRoomId: ROOM_ID,
          chatRoomQueryKey: CHAT_ROOM_KEY,
          chatMessageQueryKey: CHAT_MSG_KEY,
        }),
      options
    );
  };

  describe('handleConnect', () => {
    it('chatRoomQueryKey를 invalidate한다', async () => {
      const { result, queryClient } = renderSync();

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.handleConnect();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CHAT_ROOM_KEY });
    });

    it('chatRoomQueryKey가 없으면 invalidate하지 않는다', () => {
      const { result, queryClient } = renderHookWithProviders(() =>
        useMessageSync({ currentRoomId: ROOM_ID })
      );
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.handleConnect();
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleReceiveMessage', () => {
    it('현재 roomId의 메시지를 캐시에 추가한다', async () => {
      const { result, queryClient } = renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      const msg = makeMessage();

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(1);
      expect(cached?.[0].messageId).toBe(1);
    });

    it('같은 messageId가 이미 있으면 중복 추가하지 않는다', () => {
      const { result, queryClient } = renderSync();
      const msg = makeMessage({ messageId: 1 });
      queryClient.setQueryData(CHAT_MSG_KEY, [msg]);

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(1);
    });

    it('메시지가 createdAt 기준으로 정렬된다', () => {
      const { result, queryClient } = renderSync();
      const later = makeMessage({ messageId: 1, createdAt: '2024-01-01T12:00:00Z' });
      const earlier = makeMessage({ messageId: 2, createdAt: '2024-01-01T09:00:00Z' });
      queryClient.setQueryData(CHAT_MSG_KEY, [later]);

      act(() => {
        result.current.handleReceiveMessage(earlier);
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached?.[0].messageId).toBe(2);
      expect(cached?.[1].messageId).toBe(1);
    });

    it('다른 roomId 메시지는 채팅 메시지 캐시에 추가하지 않는다', () => {
      const { result, queryClient } = renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      const msg = makeMessage({ roomId: 999 });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(0);
    });

    it('상대방 메시지 수신 시 unreadMessageCount를 1 증가시킨다', () => {
      const { result, queryClient } = renderSync();
      const room = makeRoomListItem({ unreadMessageCount: 2 });
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);

      const msg = makeMessage({ isMine: false });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(3);
    });

    it('내 메시지 수신 시 unreadMessageCount를 변경하지 않는다', () => {
      const { result, queryClient } = renderSync();
      const room = makeRoomListItem({ unreadMessageCount: 2 });
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);

      const msg = makeMessage({ isMine: true });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(2);
    });

    it('방 목록의 lastMessage와 lastMessageTime을 업데이트한다', () => {
      const { result, queryClient } = renderSync();
      const room = makeRoomListItem();
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);

      const msg = makeMessage({ content: '새 메시지', createdAt: '2024-01-02T00:00:00Z' });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('새 메시지');
      expect(rooms?.[0].lastMessageTime).toBe('2024-01-02T00:00:00Z');
    });

    it('이미지 메시지 수신 시 lastMessage를 "(사진)"으로 표시한다', () => {
      const { result, queryClient } = renderSync();
      const room = makeRoomListItem();
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);

      const msg = makeMessage({ content: null, messageType: 'IMAGE' });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('(사진)');
    });

    it('매칭되는 pending 메시지를 큐에서 제거한다', () => {
      const removeMessage = jest.fn();
      setupPendingMessages([
        {
          tempId: 'temp-1',
          roomId: ROOM_ID,
          messageType: 'TEXT',
          content: '안녕',
          imageIds: [],
        },
      ]);
      mockGetState.mockReturnValue({
        pendingMessages: [
          {
            tempId: 'temp-1',
            roomId: ROOM_ID,
            messageType: 'TEXT',
            content: '안녕',
            imageIds: [],
          },
        ],
        removeMessage,
      });

      const { result, queryClient } = renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      const msg = makeMessage({ roomId: ROOM_ID, messageType: 'TEXT', content: '안녕' });

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      expect(removeMessage).toHaveBeenCalledWith('temp-1');
    });

    it('유효하지 않은 메시지 객체를 무시한다', () => {
      const { result, queryClient } = renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      expect(() => {
        act(() => {
          result.current.handleReceiveMessage(null as unknown as ChatMessageResponse);
        });
      }).not.toThrow();
    });
  });

  describe('markRoomAsRead', () => {
    it('마지막 메시지로 markChatAsRead를 호출한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      const { result, queryClient } = renderSync();

      const messages = [
        makeMessage({ messageId: 1, createdAt: '2024-01-01T09:00:00Z' }),
        makeMessage({ messageId: 2, createdAt: '2024-01-01T12:00:00Z' }),
      ];
      queryClient.setQueryData(CHAT_MSG_KEY, messages);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).toHaveBeenCalledWith(ROOM_ID, 2);
    });

    it('성공 시 unreadMessageCount를 0으로 설정한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      const { result, queryClient } = renderSync();

      const room = makeRoomListItem({ unreadMessageCount: 5 });
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);
      queryClient.setQueryData(CHAT_MSG_KEY, [makeMessage()]);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('API 실패 시에도 unreadMessageCount를 0으로 설정한다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMarkChatAsRead.mockRejectedValue(new Error('API error'));

      const { result, queryClient } = renderSync();
      const room = makeRoomListItem({ unreadMessageCount: 3 });
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);
      queryClient.setQueryData(CHAT_MSG_KEY, [makeMessage()]);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('메시지가 없으면 API를 호출하지 않고 unreadCount만 0으로 설정한다', async () => {
      const { result, queryClient } = renderSync();
      const room = makeRoomListItem({ unreadMessageCount: 2 });
      queryClient.setQueryData(CHAT_ROOM_KEY, [room]);
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).not.toHaveBeenCalled();
      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });
  });
});
