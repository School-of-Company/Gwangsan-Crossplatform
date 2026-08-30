import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useMessageSync } from '../useMessageSync';
import { useChatQueueStore } from '~/shared/store/useChatQueueStore';
import { markChatAsRead } from '../../api/markChatAsRead';
import { getCurrentUserId } from '~/shared/lib/getCurrentUserId';
import type { ChatMessageResponse, ChatRoomListItem } from '../chatTypes';
import type { QueryClient } from '@tanstack/react-query';
import { chatMessageKeys } from '../chatQueryKeys';

jest.mock('../../api/markChatAsRead', () => ({
  markChatAsRead: jest.fn(),
}));

jest.mock('~/shared/store/useChatQueueStore', () => ({
  useChatQueueStore: {
    getState: jest.fn(),
  },
}));

jest.mock('~/shared/lib/getCurrentUserId', () => ({
  getCurrentUserId: jest.fn(),
}));

const mockMarkChatAsRead = markChatAsRead as jest.Mock;
const mockGetState = useChatQueueStore.getState as jest.Mock;
const mockGetCurrentUserId = getCurrentUserId as jest.Mock;

const MY_USER_ID = 42;
const OTHER_USER_ID = 99;
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
  senderId: OTHER_USER_ID,
  checked: false,
  isMine: false,
  ...overrides,
});

const makeRoomListItem = (overrides: Partial<ChatRoomListItem> = {}): ChatRoomListItem => ({
  roomId: ROOM_ID,
  member: { memberId: OTHER_USER_ID, nickname: '상대방' },
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
    mockGetCurrentUserId.mockResolvedValue(MY_USER_ID);
    mockMarkChatAsRead.mockResolvedValue(undefined);
  });

  const renderSync = async (queryClient?: QueryClient) => {
    const options = queryClient ? { queryClient } : {};
    const rendered = renderHookWithProviders(
      () =>
        useMessageSync({
          currentRoomId: ROOM_ID,
          chatRoomQueryKey: CHAT_ROOM_KEY,
          chatMessageQueryKey: CHAT_MSG_KEY,
        }),
      options
    );
    await act(async () => {});
    return rendered;
  };

  describe('userId 초기화', () => {
    it('마운트 시 getCurrentUserId를 한 번만 호출한다', async () => {
      await renderSync();

      expect(mockGetCurrentUserId).toHaveBeenCalledTimes(1);
    });

    it('userId가 초기화되기 전에 수신한 메시지는 유실하지 않고 큐에 저장했다가 확인 후 반영한다', async () => {
      let resolveUserId: (id: number) => void = () => {};
      mockGetCurrentUserId.mockReturnValue(
        new Promise<number>((resolve) => {
          resolveUserId = resolve;
        })
      );

      const rendered = renderHookWithProviders(() =>
        useMessageSync({
          currentRoomId: ROOM_ID,
          chatRoomQueryKey: CHAT_ROOM_KEY,
          chatMessageQueryKey: CHAT_MSG_KEY,
        })
      );
      rendered.queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        rendered.result.current.handleReceiveMessage(makeMessage());
      });

      // userId 확인 전에는 아직 반영되지 않는다
      expect(rendered.queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY)).toHaveLength(
        0
      );

      await act(async () => {
        resolveUserId(MY_USER_ID);
        await Promise.resolve();
        await Promise.resolve();
      });

      const cached = rendered.queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(1);
    });

    it('getCurrentUserId 실패 시 메시지를 처리하지 않는다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetCurrentUserId.mockRejectedValue(new Error('Auth error'));

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(makeMessage());
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(0);
    });
  });

  describe('handleConnect', () => {
    it('chatRoomQueryKey와 현재 방의 chatRoomData를 invalidate한다', async () => {
      const { result, queryClient } = await renderSync();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.handleConnect();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CHAT_ROOM_KEY });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chatRoomData', ROOM_ID] });
    });

    it('chatRoomQueryKey가 없어도 currentRoomId의 chatRoomData는 invalidate한다', async () => {
      const rendered = renderHookWithProviders(() => useMessageSync({ currentRoomId: ROOM_ID }));
      await act(async () => {});
      const invalidateSpy = jest.spyOn(rendered.queryClient, 'invalidateQueries');

      act(() => {
        rendered.result.current.handleConnect();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chatRoomData', ROOM_ID] });
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });

    it('currentRoomId가 없으면 chatRoomData를 invalidate하지 않는다', async () => {
      const rendered = renderHookWithProviders(() =>
        useMessageSync({ chatRoomQueryKey: CHAT_ROOM_KEY })
      );
      await act(async () => {});
      const invalidateSpy = jest.spyOn(rendered.queryClient, 'invalidateQueries');

      act(() => {
        rendered.result.current.handleConnect();
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CHAT_ROOM_KEY });
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleReceiveMessage', () => {
    it('현재 roomId의 메시지를 캐시에 추가한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(makeMessage());
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(1);
      expect(cached?.[0].messageId).toBe(1);
    });

    it('senderId가 내 userId와 같으면 isMine을 true로 교정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(makeMessage({ senderId: MY_USER_ID, isMine: false }));
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached?.[0].isMine).toBe(true);
    });

    it('senderId가 다른 사용자이면 isMine을 false로 교정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(makeMessage({ senderId: OTHER_USER_ID, isMine: true }));
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached?.[0].isMine).toBe(false);
    });

    it('같은 messageId가 이미 있으면 중복 추가하지 않는다', async () => {
      const { result, queryClient } = await renderSync();
      const msg = makeMessage({ messageId: 1 });
      queryClient.setQueryData(CHAT_MSG_KEY, [msg]);

      act(() => {
        result.current.handleReceiveMessage(msg);
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(1);
    });

    it('메시지가 createdAt 기준으로 정렬된다', async () => {
      const { result, queryClient } = await renderSync();
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

    it('다른 roomId 메시지는 채팅 메시지 캐시에 추가하지 않는다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(makeMessage({ roomId: 999 }));
      });

      const cached = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cached).toHaveLength(0);
    });

    it('비활성 방의 상대방 메시지 수신 시 unreadMessageCount를 1 증가시킨다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ roomId: OTHER_ROOM_ID, messageId: 1, unreadMessageCount: 2 }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ messageId: 2, roomId: OTHER_ROOM_ID, senderId: OTHER_USER_ID })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].unreadMessageCount).toBe(3);
      });
    });

    it('비활성 방의 내 메시지 수신 시 unreadMessageCount를 변경하지 않는다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ roomId: OTHER_ROOM_ID, messageId: 1, unreadMessageCount: 2 }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ messageId: 2, roomId: OTHER_ROOM_ID, senderId: MY_USER_ID })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].unreadMessageCount).toBe(2);
      });
    });

    it('현재 활성화된 방의 메시지 수신 시 unreadMessageCount를 0으로 설정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ messageId: 1, unreadMessageCount: 5 }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(makeMessage({ messageId: 2, senderId: OTHER_USER_ID }));
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].unreadMessageCount).toBe(0);
      });
    });

    it('동일 messageId의 중복 메시지 수신 시 room 정보를 변경하지 않는다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          roomId: OTHER_ROOM_ID,
          messageId: 7,
          unreadMessageCount: 2,
          lastMessage: '원본 메시지',
          lastMessageTime: '2024-01-01T09:00:00Z',
        }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 7,
            roomId: OTHER_ROOM_ID,
            senderId: OTHER_USER_ID,
            content: '다른 내용',
            createdAt: '2024-01-02T00:00:00Z',
          })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].unreadMessageCount).toBe(2);
        expect(rooms?.[0].lastMessage).toBe('원본 메시지');
        expect(rooms?.[0].lastMessageTime).toBe('2024-01-01T09:00:00Z');
      });
    });

    it('과거 메시지(lastMessageTime보다 이전) 수신 시 unreadMessageCount를 증가시키지 않는다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          roomId: OTHER_ROOM_ID,
          messageId: 10,
          unreadMessageCount: 2,
          lastMessageTime: '2024-01-02T00:00:00Z',
        }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 5,
            roomId: OTHER_ROOM_ID,
            senderId: OTHER_USER_ID,
            createdAt: '2024-01-01T00:00:00Z',
          })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].unreadMessageCount).toBe(2);
      });
    });

    it('과거 메시지 수신 시 lastMessage/messageId를 과거 값으로 덮어쓰지 않는다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          roomId: OTHER_ROOM_ID,
          messageId: 10,
          lastMessage: '최신 메시지',
          lastMessageTime: '2024-01-02T00:00:00Z',
        }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 5,
            roomId: OTHER_ROOM_ID,
            content: '과거 메시지',
            senderId: OTHER_USER_ID,
            createdAt: '2024-01-01T00:00:00Z',
          })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].lastMessage).toBe('최신 메시지');
        expect(rooms?.[0].messageId).toBe(10);
        expect(rooms?.[0].lastMessageTime).toBe('2024-01-02T00:00:00Z');
      });
    });

    it('메시지 수신 시 room의 messageId를 최신값으로 업데이트한다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ roomId: OTHER_ROOM_ID, messageId: 1 }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ messageId: 42, roomId: OTHER_ROOM_ID, senderId: OTHER_USER_ID })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].messageId).toBe(42);
      });
    });

    it('방 목록의 lastMessage와 lastMessageTime을 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ messageId: 1 })]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ messageId: 2, content: '새 메시지', createdAt: '2024-01-02T00:00:00Z' })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].lastMessage).toBe('새 메시지');
        expect(rooms?.[0].lastMessageTime).toBe('2024-01-02T00:00:00Z');
      });
    });

    it('이미지 메시지 수신 시 lastMessage를 "(사진)"으로 표시한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ messageId: 1 })]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 2,
            content: null,
            messageType: 'IMAGE',
            createdAt: '2024-01-02T00:00:00Z',
          })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.[0].lastMessage).toBe('(사진)');
      });
    });

    it('매칭되는 pending 메시지를 큐에서 제거한다', async () => {
      const removeMessage = jest.fn();
      mockGetState.mockReturnValue({
        pendingMessages: [
          { tempId: 'temp-1', roomId: ROOM_ID, messageType: 'TEXT', content: '안녕', imageIds: [] },
        ],
        removeMessage,
      });

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ roomId: ROOM_ID, messageType: 'TEXT', content: '안녕' })
        );
      });

      expect(removeMessage).toHaveBeenCalledWith('temp-1');
    });

    it('IMAGE 타입 pending 메시지를 imageIds 기준으로 매칭해 큐에서 제거한다', async () => {
      const removeMessage = jest.fn();
      mockGetState.mockReturnValue({
        pendingMessages: [
          {
            tempId: 'temp-img-1',
            roomId: ROOM_ID,
            messageType: 'IMAGE',
            content: null,
            imageIds: [10, 20],
          },
        ],
        removeMessage,
      });

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            roomId: ROOM_ID,
            messageType: 'IMAGE',
            content: null,
            images: [
              { imageId: 10, imageUrl: 'url1' },
              { imageId: 20, imageUrl: 'url2' },
            ],
          })
        );
      });

      expect(removeMessage).toHaveBeenCalledWith('temp-img-1');
    });

    it('다른 roomId 메시지도 room list는 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        { ...makeRoomListItem(), roomId: 999, messageId: 1 },
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 2,
            roomId: 999,
            content: '다른 방 메시지',
            createdAt: '2024-01-02T00:00:00Z',
          })
        );
      });

      const msgCache = queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(msgCache).toHaveLength(0);

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('다른 방 메시지');
    });

    it('유효하지 않은 메시지 객체를 무시한다', async () => {
      const { result } = await renderSync();

      expect(() => {
        act(() => {
          result.current.handleReceiveMessage(null as unknown as ChatMessageResponse);
        });
      }).not.toThrow();
    });

    it('현재 방의 상대방 메시지 수신 시 markChatAsRead(자동) 실패하면 logger.error를 호출한다', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMarkChatAsRead.mockRejectedValue(new Error('mark failed'));

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      await act(async () => {
        result.current.handleReceiveMessage(makeMessage({ senderId: OTHER_USER_ID }));
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'markChatAsRead (auto) failed',
        expect.any(Error)
      );
    });

    it('roomId 또는 messageType이 다른 pending 메시지는 큐에서 제거하지 않는다', async () => {
      const removeMessage = jest.fn();
      mockGetState.mockReturnValue({
        pendingMessages: [
          {
            tempId: 'temp-other-room',
            roomId: 999,
            messageType: 'TEXT',
            content: '안녕',
            imageIds: [],
          },
          {
            tempId: 'temp-other-type',
            roomId: ROOM_ID,
            messageType: 'IMAGE',
            content: null,
            imageIds: [],
          },
        ],
        removeMessage,
      });

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({ roomId: ROOM_ID, messageType: 'TEXT', content: '안녕' })
        );
      });

      expect(removeMessage).not.toHaveBeenCalled();
    });

    it('IMAGE 타입 pending 메시지가 이미지 개수 불일치로 매칭되지 않으면 큐에서 제거하지 않는다', async () => {
      const removeMessage = jest.fn();
      mockGetState.mockReturnValue({
        pendingMessages: [
          {
            tempId: 'temp-img-mismatch',
            roomId: ROOM_ID,
            messageType: 'IMAGE',
            content: null,
            imageIds: [10, 20],
          },
        ],
        removeMessage,
      });

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            roomId: ROOM_ID,
            messageType: 'IMAGE',
            content: null,
            images: [{ imageId: 10, imageUrl: 'url1' }],
          })
        );
      });

      expect(removeMessage).not.toHaveBeenCalled();
    });

    it('handleReceiveMessage 처리 중 예외가 발생하면 logger.error를 호출하고 전파하지 않는다', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetState.mockImplementationOnce(() => {
        throw new Error('queue store boom');
      });

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      expect(() => {
        act(() => {
          result.current.handleReceiveMessage(makeMessage());
        });
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('handleReceiveMessage error', expect.any(Error));
    });

    it('chatRoomQueryKey가 없으면 방 목록 캐시를 건드리지 않는다', async () => {
      const rendered = renderHookWithProviders(() =>
        useMessageSync({ currentRoomId: ROOM_ID, chatMessageQueryKey: CHAT_MSG_KEY })
      );
      await act(async () => {});
      rendered.queryClient.setQueryData(CHAT_MSG_KEY, []);

      expect(() => {
        act(() => {
          rendered.result.current.handleReceiveMessage(makeMessage());
        });
      }).not.toThrow();

      const cachedMessages = rendered.queryClient.getQueryData<ChatMessageResponse[]>(CHAT_MSG_KEY);
      expect(cachedMessages).toHaveLength(1);
      expect(rendered.queryClient.getQueryData(CHAT_ROOM_KEY)).toBeUndefined();
    });

    it('메시지의 roomId와 일치하지 않는 다른 방들은 그대로 유지한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ roomId: 1, messageId: 1, lastMessage: '방1 메시지' }),
        makeRoomListItem({ roomId: 2, messageId: 1, lastMessage: '방2 메시지' }),
      ]);

      act(() => {
        result.current.handleReceiveMessage(
          makeMessage({
            messageId: 99,
            roomId: 1,
            content: '새 메시지',
            createdAt: '2024-01-02T00:00:00Z',
          })
        );
      });

      await waitFor(() => {
        const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
        expect(rooms?.find((r) => r.roomId === 1)?.lastMessage).toBe('새 메시지');
        expect(rooms?.find((r) => r.roomId === 2)?.lastMessage).toBe('방2 메시지');
      });
    });
  });

  describe('handleUpdateRoomList', () => {
    it('매칭되는 roomId의 lastMessage, lastMessageType, lastMessageTime을 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem()]);

      act(() => {
        result.current.handleUpdateRoomList({
          roomId: ROOM_ID,
          lastMessage: '새 메시지',
          lastMessageType: 'TEXT',
          lastMessageTime: '2024-01-02T00:00:00Z',
        });
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('새 메시지');
      expect(rooms?.[0].lastMessageType).toBe('TEXT');
      expect(rooms?.[0].lastMessageTime).toBe('2024-01-02T00:00:00Z');
    });

    it('매칭되지 않는 roomId는 업데이트하지 않는다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem()]);

      act(() => {
        result.current.handleUpdateRoomList({
          roomId: 999,
          lastMessage: '다른 방 메시지',
          lastMessageType: 'TEXT',
          lastMessageTime: '2024-01-02T00:00:00Z',
        });
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('이전 메시지');
    });

    it('chatRoomQueryKey가 없으면 캐시를 변경하지 않는다', async () => {
      const rendered = renderHookWithProviders(() => useMessageSync({ currentRoomId: ROOM_ID }));
      await act(async () => {});
      rendered.queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem()]);

      act(() => {
        rendered.result.current.handleUpdateRoomList({
          roomId: ROOM_ID,
          lastMessage: '새 메시지',
          lastMessageType: 'TEXT',
          lastMessageTime: '2024-01-02T00:00:00Z',
        });
      });

      const rooms = rendered.queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].lastMessage).toBe('이전 메시지');
    });

    it('캐시 데이터가 없으면 undefined를 반환한다', async () => {
      const { result, queryClient } = await renderSync();

      act(() => {
        result.current.handleUpdateRoomList({
          roomId: ROOM_ID,
          lastMessage: '새 메시지',
          lastMessageType: 'TEXT',
          lastMessageTime: '2024-01-02T00:00:00Z',
        });
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms).toBeUndefined();
    });
  });

  describe('handleTransactionStateChanged', () => {
    const ROOM_DATA_KEY = ['chatRoomData', ROOM_ID];

    it('현재 roomId와 일치하면 product.isCompleted를 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, { product: { id: 1, isCompleted: false } });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompleted).toBe(true);
    });

    it('payload에 isReserved가 있으면 product.isReserved를 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isReserved: false },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          isReserved: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isReserved).toBe(true);
    });

    it('payload에 isReserved가 없으면 기존 product.isReserved를 유지한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isReserved: true },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isReserved).toBe(true);
    });

    it('다른 방의 이벤트는 현재 방의 캐시를 변경하지 않는다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, { product: { id: 1, isCompleted: false } });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: 999,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompleted).toBe(false);
    });

    it('product가 null이면 캐시를 변경하지 않는다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, { product: null });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: null }>(ROOM_DATA_KEY);
      expect(cached?.product).toBeNull();
    });

    it('기존 createdAt이 없으면 payload의 createdAt을 설정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, createdAt: null },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-06-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.createdAt).toBe('2024-06-01T00:00:00Z');
    });

    it('isCompleted=true이면 isCompletable을 false로 업데이트한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isCompletable: true },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompletable).toBe(false);
    });

    it('isCompleted=false이면 기존 isCompletable을 유지한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isCompletable: true },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompletable).toBe(true);
    });

    it('기존 createdAt이 이미 있어도 payload의 createdAt으로 덮어쓴다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, createdAt: '2024-01-01T00:00:00Z' },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-06-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.createdAt).toBe('2024-06-01T00:00:00Z');
    });

    it('payload의 createdAt이 null이면(거래 철회) 기존 createdAt을 지운다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, createdAt: '2024-01-01T00:00:00Z' },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          createdAt: null,
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.createdAt).toBeNull();
    });

    it('requestedBySeller가 판매자와 일치하면(본인이 요청) isCompletable을 false로 계산한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isSeller: true, isCompletable: false },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00Z',
          requestedBySeller: true,
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompletable).toBe(false);
    });

    it('requestedBySeller가 판매자와 다르면(상대방이 요청) isCompletable을 true로 계산한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: false, isSeller: true, isCompletable: false },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00Z',
          requestedBySeller: false,
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompletable).toBe(true);
    });

    it('현재 보고 있지 않은 방(currentRoomId와 다른 roomId)이어도 그 방의 chatRoomData 캐시는 갱신한다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(['chatRoomData', OTHER_ROOM_ID], {
        product: { id: 1, isCompleted: false },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: OTHER_ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>([
        'chatRoomData',
        OTHER_ROOM_ID,
      ]);
      expect(cached?.product.isCompleted).toBe(true);
    });

    it('payload에 isCompletable이 있으면 그 값을 그대로 반영한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(ROOM_DATA_KEY, {
        product: { id: 1, isCompleted: true, isCompletable: false },
      });

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: false,
          isCompletable: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<{ product: Record<string, unknown> }>(ROOM_DATA_KEY);
      expect(cached?.product.isCompletable).toBe(true);
    });

    it('채팅 목록 캐시에서 해당 방의 product.isCompleted/isReserved를 갱신한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          product: { productId: 1, title: '상품', isCompleted: false, images: [] },
        }),
      ]);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          isReserved: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(cached?.[0].product?.isCompleted).toBe(true);
      expect(cached?.[0].product?.isReserved).toBe(true);
    });

    it('채팅 목록 캐시에서 다른 방은 그대로 유지한다', async () => {
      const OTHER_ROOM_ID = 200;
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          roomId: OTHER_ROOM_ID,
          product: { productId: 1, title: '상품', isCompleted: false, images: [] },
        }),
      ]);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(cached?.[0].product?.isCompleted).toBe(false);
    });

    it('목록 캐시의 방에 product가 없으면 그대로 둔다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ product: undefined as never })]);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const cached = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(cached?.[0].product).toBeUndefined();
    });

    it('chatRoomQueryKey를 invalidate하여 새로 생긴 거래 정보(title/images 등)를 다시 받아온다', async () => {
      const { result, queryClient } = await renderSync();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: CHAT_ROOM_KEY });
    });

    it('chatRoomQueryKey가 없으면 목록 캐시 처리를 하지 않는다', async () => {
      const rendered = renderHookWithProviders(() => useMessageSync({ currentRoomId: ROOM_ID }));
      await act(async () => {});
      const invalidateSpy = jest.spyOn(rendered.queryClient, 'invalidateQueries');

      expect(() => {
        act(() => {
          rendered.result.current.handleTransactionStateChanged({
            roomId: ROOM_ID,
            productId: 1,
            isCompleted: true,
            createdAt: '2024-01-01T00:00:00Z',
          });
        });
      }).not.toThrow();
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('currentRoomId가 없는 목록 화면에서도 목록 캐시를 갱신한다', async () => {
      const { result, queryClient } = renderHookWithProviders(() =>
        useMessageSync({ chatRoomQueryKey: CHAT_ROOM_KEY })
      );
      await act(async () => {});

      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          product: { productId: 1, title: '상품', isCompleted: false, images: [] },
        }),
      ]);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].product.isCompleted).toBe(true);
    });

    it('목록에서 이벤트와 무관한 방은 참조까지 그대로 유지한다', async () => {
      const { result, queryClient } = await renderSync();
      const otherRoom = makeRoomListItem({
        roomId: 999,
        product: { productId: 2, title: '다른 상품', isCompleted: false, images: [] },
      });
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({
          product: { productId: 1, title: '상품', isCompleted: false, images: [] },
        }),
        otherRoom,
      ]);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[1]).toBe(otherRoom);
    });

    it('목록 캐시에 바뀔 값이 없으면 기존 배열 참조를 그대로 반환한다', async () => {
      const { result, queryClient } = await renderSync();
      const rooms = [
        makeRoomListItem({
          product: { productId: 1, title: '상품', isCompleted: true, images: [] },
        }),
      ];
      queryClient.setQueryData(CHAT_ROOM_KEY, rooms);

      act(() => {
        result.current.handleTransactionStateChanged({
          roomId: ROOM_ID,
          productId: 1,
          isCompleted: true,
          createdAt: '2024-01-01T00:00:00Z',
        });
      });

      expect(queryClient.getQueryData(CHAT_ROOM_KEY)).toBe(rooms);
    });
  });

  describe('markRoomAsRead', () => {
    it('마지막 메시지로 markChatAsRead를 호출한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      const { result, queryClient } = await renderSync();

      queryClient.setQueryData(CHAT_MSG_KEY, [
        makeMessage({ messageId: 1, createdAt: '2024-01-01T09:00:00Z' }),
        makeMessage({ messageId: 2, createdAt: '2024-01-01T12:00:00Z' }),
      ]);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).toHaveBeenCalledWith(ROOM_ID, 2);
    });

    it('성공 시 unreadMessageCount를 0으로 설정한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      const { result, queryClient } = await renderSync();

      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ unreadMessageCount: 5 })]);
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

      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ unreadMessageCount: 3 })]);
      queryClient.setQueryData(CHAT_MSG_KEY, [makeMessage()]);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('chatMessageQueryKey가 없으면 chatMessageKeys.room(roomId) fallback으로 메시지를 조회한다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);

      const rendered = renderHookWithProviders(() =>
        useMessageSync({
          currentRoomId: ROOM_ID,
          chatRoomQueryKey: CHAT_ROOM_KEY,
        })
      );
      await act(async () => {});

      rendered.queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ unreadMessageCount: 3 }),
      ]);
      rendered.queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [
        makeMessage({ messageId: 5 }),
      ]);

      await act(async () => {
        await rendered.result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).toHaveBeenCalledWith(ROOM_ID, 5);
      const rooms = rendered.queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('chatRoomQueryKey가 없으면 아무것도 하지 않는다', async () => {
      const rendered = renderHookWithProviders(() => useMessageSync({ currentRoomId: ROOM_ID }));
      await act(async () => {});

      await act(async () => {
        await rendered.result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).not.toHaveBeenCalled();
    });

    it('메시지가 없으면 API를 호출하지 않고 unreadCount만 0으로 설정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [makeRoomListItem({ unreadMessageCount: 2 })]);
      queryClient.setQueryData(CHAT_MSG_KEY, []);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      expect(mockMarkChatAsRead).not.toHaveBeenCalled();
      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.[0].unreadMessageCount).toBe(0);
    });

    it('markRoomAsRead 호출 시 대상이 아닌 다른 방의 unreadMessageCount는 변경하지 않는다', async () => {
      mockMarkChatAsRead.mockResolvedValue(undefined);
      const { result, queryClient } = await renderSync();

      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ roomId: ROOM_ID, unreadMessageCount: 5 }),
        makeRoomListItem({ roomId: 999, unreadMessageCount: 3 }),
      ]);
      queryClient.setQueryData(CHAT_MSG_KEY, [makeMessage()]);

      await act(async () => {
        await result.current.markRoomAsRead(ROOM_ID);
      });

      const rooms = queryClient.getQueryData<ChatRoomListItem[]>(CHAT_ROOM_KEY);
      expect(rooms?.find((r) => r.roomId === ROOM_ID)?.unreadMessageCount).toBe(0);
      expect(rooms?.find((r) => r.roomId === 999)?.unreadMessageCount).toBe(3);
    });

    it('마지막 메시지와 room.messageId가 모두 없으면 markRead 대상 메시지 없이 unreadCount만 0으로 설정한다', async () => {
      const { result, queryClient } = await renderSync();
      queryClient.setQueryData(CHAT_ROOM_KEY, [
        makeRoomListItem({ unreadMessageCount: 4, messageId: undefined as unknown as number }),
      ]);
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
