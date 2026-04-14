import { renderHookWithProviders, createQueryClient } from '~/test-utils';
import { useChatMessages } from '../useChatMessages';

import { useChatMessages as useChatMessagesEntity } from '~/entity/chat';
import { useChatSocket } from '~/entity/chat/model/useChatSocket';
import { useResilientMessageSender } from '~/entity/chat/hooks/useResilientMessageSender';
import { extractOtherUserInfo, ensureMessagesArray } from '~/shared/lib/userUtils';

jest.mock('~/entity/chat', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('~/entity/chat/model/useChatSocket', () => ({
  useChatSocket: jest.fn(),
}));

jest.mock('~/entity/chat/hooks/useResilientMessageSender', () => ({
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
  });
  mockUseResilientMessageSender.mockReturnValue({ sendMessage: jest.fn() });
  mockEnsureMessagesArray.mockReturnValue([]);
  mockExtractOtherUserInfo.mockReturnValue({ nickname: '상대방', id: undefined });
};

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('useChatMessages', () => {
  describe('초기 상태', () => {
    it('messages, isLoading, isError, connectionState를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.connectionState).toBe('connected');
    });

    it('flatListRef를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(result.current.flatListRef).toBeDefined();
    });

    it('markRoomAsRead 함수를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(typeof result.current.markRoomAsRead).toBe('function');
    });
  });

  describe('otherUserInfo', () => {
    it('캐시에 roomData가 없으면 extractOtherUserInfo를 사용한다', () => {
      mockExtractOtherUserInfo.mockReturnValue({ nickname: '광산주민', id: 42 });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
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
        () => useChatMessages({ roomId: 'room-1' as any }),
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
        useChatMessages({ roomId: 'room-1' as any })
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
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(result.current.connectionState).toBe('connecting');
    });
  });

  describe('messageHandlers.sendMessage', () => {
    it('imageIds가 있으면 IMAGE 타입으로 resilientSendMessage를 호출한다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('내용', [1, 2]);

      expect(mockResilientSend).toHaveBeenCalledWith('내용', 'IMAGE', [1, 2]);
    });

    it('imageIds가 없고 content가 있으면 TEXT 타입으로 resilientSendMessage를 호출한다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('안녕하세요', []);

      expect(mockResilientSend).toHaveBeenCalledWith('안녕하세요', 'TEXT', []);
    });

    it('content가 null이고 imageIds도 없으면 resilientSendMessage를 호출하지 않는다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage(null, []);

      expect(mockResilientSend).not.toHaveBeenCalled();
    });

    it('content가 빈 문자열이고 imageIds도 없으면 resilientSendMessage를 호출하지 않는다', () => {
      const mockResilientSend = jest.fn();
      mockUseResilientMessageSender.mockReturnValue({ sendMessage: mockResilientSend });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      result.current.messageHandlers.sendMessage('', []);

      expect(mockResilientSend).not.toHaveBeenCalled();
    });
  });

  describe('messageHandlers.renderMessage', () => {
    it('renderMessage는 항상 null을 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      const output = result.current.messageHandlers.renderMessage({
        item: { id: 1, content: '테스트' } as any,
      });

      expect(output).toBeNull();
    });
  });

  describe('scrollToEnd', () => {
    it('scrollToEnd 함수를 반환한다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(typeof result.current.scrollToEnd).toBe('function');
    });

    it('flatListRef가 없어도 scrollToEnd 호출 시 오류가 없다', () => {
      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      result.current.scrollToEnd(false);
    });
  });

  describe('isLoading / isError', () => {
    it('isLoading=true를 반환한다', () => {
      mockUseChatMessagesEntity.mockReturnValue({ data: [], isLoading: true, isError: false });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('isError=true를 반환한다', () => {
      mockUseChatMessagesEntity.mockReturnValue({ data: [], isLoading: false, isError: true });

      const { result } = renderHookWithProviders(() =>
        useChatMessages({ roomId: 'room-1' as any })
      );

      expect(result.current.isError).toBe(true);
    });
  });
});
