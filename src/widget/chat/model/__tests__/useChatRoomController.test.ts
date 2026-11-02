import { renderHookWithProviders, createQueryClient } from '~/test-utils';
import { useChatRoomController } from '../useChatRoomController';

import { useChatMessages as useChatMessagesEntity } from '~/entity/chat';
import { useChatSocket } from '~/entity/chat/model/useChatSocket';
import { useResilientMessageSender } from '~/entity/chat/model/useResilientMessageSender';
import { extractOtherUserInfo, ensureMessagesArray } from '~/shared/lib/userUtils';

jest.mock('~/entity/chat', () => ({
  useChatMessages: jest.fn(),
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
  chatMessageKeys: { all: ['chatMessages'], room: (roomId: unknown) => ['chatMessages', roomId] },
}));

jest.mock('~/entity/chat/model/useChatSocket', () => ({
  useChatSocket: jest.fn(),
}));

jest.mock('~/entity/chat/model/useResilientMessageSender', () => ({
  useResilientMessageSender: jest.fn(),
}));

jest.mock('~/shared/lib/userUtils', () => ({
  extractOtherUserInfo: jest.fn(),
  ensureMessagesArray: jest.fn(),
}));

const mockUseChatMessagesEntity = useChatMessagesEntity as jest.Mock;
const mockUseChatSocket = useChatSocket as jest.Mock;
const mockUseResilientMessageSender = useResilientMessageSender as jest.Mock;
const mockExtractOtherUserInfo = extractOtherUserInfo as jest.Mock;
const mockEnsureMessagesArray = ensureMessagesArray as jest.Mock;

const setupMocks = () => {
  mockUseChatMessagesEntity.mockReturnValue({ data: [], isLoading: false, isError: false });
  mockUseChatSocket.mockReturnValue({
    sendMessage: jest.fn(),
    markRoomAsRead: jest.fn(),
    connectionState: 'connected',
    isBlockedByOtherUser: false,
  });
  mockUseResilientMessageSender.mockReturnValue({ sendMessage: jest.fn() });
  mockEnsureMessagesArray.mockReturnValue([]);
  mockExtractOtherUserInfo.mockReturnValue({ nickname: '상대방', id: undefined });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('useChatRoomController', () => {
  describe('초기 상태', () => {
    it('messages, isLoading, isError, connectionState를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.connectionState).toBe('connected');
    });

    it('flatListRef를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.flatListRef).toBeDefined();
    });

    it('markRoomAsRead 함수를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(typeof result.current.markRoomAsRead).toBe('function');
    });
  });

  describe('otherUserInfo', () => {
    it('캐시에 roomData가 없으면 extractOtherUserInfo를 사용한다', () => {
      mockExtractOtherUserInfo.mockReturnValue({ nickname: '광산주민', id: 42 });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.otherUserInfo).toEqual({ nickname: '광산주민', id: 42 });
    });

    it('캐시에 해당 room이 있으면 member 정보를 우선 사용한다', () => {
      const preloadedClient = createQueryClient();
      preloadedClient.setQueryData(
        ['chatRooms', 'list'],
        [
          {
            roomId: 'room-1',
            member: { nickname: '캐시닉네임', memberId: 99 },
          },
        ]
      );

      const { result } = renderHookWithProviders(
        () => useChatRoomController({ roomId: 'room-1' as any }),
        { queryClient: preloadedClient }
      );

      expect(result.current.otherUserInfo).toEqual({ nickname: '캐시닉네임', id: 99 });
    });
  });

  describe('connectionState', () => {
    it('disconnected 상태를 반환한다', () => {
      mockUseChatSocket.mockReturnValue({
        sendMessage: jest.fn(),
        markRoomAsRead: jest.fn(),
        connectionState: 'disconnected',
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.connectionState).toBe('disconnected');
    });

    it('connecting 상태를 반환한다', () => {
      mockUseChatSocket.mockReturnValue({
        sendMessage: jest.fn(),
        markRoomAsRead: jest.fn(),
        connectionState: 'connecting',
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.connectionState).toBe('connecting');
    });
  });

  describe('messageHandlers.sendMessage', () => {
    it('imageIds가 있으면 IMAGE 타입으로 resilientSendMessage를 호출한다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('내용', [1, 2]);

      expect(mockResilientSend).toHaveBeenCalledWith('내용', 'IMAGE', [1, 2], undefined);
    });

    it('imageIds가 없고 content가 있으면 TEXT 타입으로 resilientSendMessage를 호출한다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('안녕하세요', []);

      expect(mockResilientSend).toHaveBeenCalledWith('안녕하세요', 'TEXT', []);
    });

    it('content가 null이고 imageIds도 없으면 resilientSendMessage를 호출하지 않는다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage(null, []);

      expect(mockResilientSend).not.toHaveBeenCalled();
    });

    it('content가 빈 문자열이고 imageIds도 없으면 resilientSendMessage를 호출하지 않는다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('', []);

      expect(mockResilientSend).not.toHaveBeenCalled();
    });
  });

  describe('scrollToEnd', () => {
    it('scrollToEnd 함수를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(typeof result.current.scrollToEnd).toBe('function');
    });

    it('flatListRef가 없어도 scrollToEnd 호출 시 오류가 없다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.scrollToEnd(false);
    });

    it('scrollToEnd는 inverted 목록의 맨 아래(offset 0)로 스크롤한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );
      const scrollToOffsetSpy = jest.fn();
      (result.current.flatListRef as any).current = { scrollToOffset: scrollToOffsetSpy };

      result.current.scrollToEnd(true);

      expect(scrollToOffsetSpy).toHaveBeenCalledWith({ offset: 0, animated: true });
    });

    it('메시지가 도착해도 스스로 강제 스크롤하지 않는다(바닥 근처 판단은 목록이 한다)', () => {
      jest.useFakeTimers();
      try {
        mockUseChatMessagesEntity.mockReturnValue({
          data: [{ messageId: 1, content: 'hi' }],
          isLoading: false,
          isError: false,
        });

        const { result } = renderHookWithProviders(() =>
          useChatRoomController({ roomId: 'room-1' as any })
        );
        const scrollToOffsetSpy = jest.fn();
        (result.current.flatListRef as any).current = { scrollToOffset: scrollToOffsetSpy };

        jest.advanceTimersByTime(1000);

        expect(scrollToOffsetSpy).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('olderMessages', () => {
    it('이전 페이지가 있으면 load가 fetchNextPage를 부른다', () => {
      const fetchNextPage = jest.fn();
      mockUseChatMessagesEntity.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );
      result.current.olderMessages.load();

      expect(result.current.olderMessages.hasMore).toBe(true);
      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('불러오는 중이거나 더 없으면 다시 요청하지 않는다', () => {
      const fetchNextPage = jest.fn();
      mockUseChatMessagesEntity.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage,
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );
      result.current.olderMessages.load();

      expect(result.current.olderMessages.isLoading).toBe(true);
      expect(fetchNextPage).not.toHaveBeenCalled();
    });
  });

  describe('isBlockedByOtherUser', () => {
    it('useChatSocket의 isBlockedByOtherUser를 그대로 반환한다', () => {
      mockUseChatSocket.mockReturnValue({
        sendMessage: jest.fn(),
        markRoomAsRead: jest.fn(),
        connectionState: 'connected',
        isBlockedByOtherUser: true,
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.isBlockedByOtherUser).toBe(true);
    });
  });

  describe('isLoading / isError', () => {
    it('isLoading=true를 반환한다', () => {
      mockUseChatMessagesEntity.mockReturnValue({ data: [], isLoading: true, isError: false });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('isError=true를 반환한다', () => {
      mockUseChatMessagesEntity.mockReturnValue({ data: [], isLoading: false, isError: true });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      expect(result.current.isError).toBe(true);
    });

    it('엔티티 쿼리의 refetch를 그대로 반환한다', () => {
      const refetch = jest.fn();
      mockUseChatMessagesEntity.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
        refetch,
      });

      const { result } = renderHookWithProviders(() =>
        useChatRoomController({ roomId: 'room-1' as any })
      );

      result.current.refetch();
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });
});
