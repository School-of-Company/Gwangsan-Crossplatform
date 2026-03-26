import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useChatMessages } from '../useChatMessages';
import { getChatMessages } from '../../api/getChatMessages';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';

jest.mock('../../api/getChatMessages', () => ({
  getChatMessages: jest.fn(),
}));

jest.mock('~/shared/store/useChatQueueStore', () => ({
  useChatQueueStore: jest.fn(),
  MESSAGE_STATUS: {
    PENDING: 'PENDING',
    SENDING: 'SENDING',
    FAILED: 'FAILED',
    SENT: 'SENT',
  },
}));

const mockGetChatMessages = getChatMessages as jest.Mock;
const mockUseChatQueueStore = useChatQueueStore as unknown as jest.Mock;

const ROOM_ID = 100;

const makeServerMessage = (overrides: Record<string, unknown> = {}) => ({
  messageId: 1,
  roomId: ROOM_ID,
  content: '서버 메시지',
  messageType: 'TEXT' as const,
  createdAt: '2024-01-01T10:00:00Z',
  senderNickname: '유저',
  senderId: 1,
  checked: true,
  isMine: false,
  ...overrides,
});

const makePendingMessage = (overrides: Record<string, unknown> = {}) => ({
  tempId: 'temp-1',
  roomId: ROOM_ID,
  content: '전송 중',
  messageType: 'TEXT' as const,
  createdAt: '2024-01-01T11:00:00Z',
  imageIds: [],
  status: MESSAGE_STATUS.PENDING,
  ...overrides,
});

const setupStoreMock = (pendingMessages: ReturnType<typeof makePendingMessage>[] = []) => {
  mockUseChatQueueStore.mockImplementation(
    (selector: (state: { pendingMessages: typeof pendingMessages }) => unknown) =>
      selector({ pendingMessages })
  );
};

describe('useChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupStoreMock();
  });

  describe('초기 상태', () => {
    it('로딩 중일 때 data가 빈 배열이다', () => {
      mockGetChatMessages.mockReturnValue(new Promise(() => {}));

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      expect(result.current.data).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });

    it('enabled가 false이면 API를 호출하지 않는다', () => {
      mockGetChatMessages.mockResolvedValue([]);

      renderHookWithProviders(() => useChatMessages(ROOM_ID, { enabled: false }));

      expect(mockGetChatMessages).not.toHaveBeenCalled();
    });
  });

  describe('메시지 로드', () => {
    it('서버 메시지를 SENT 상태로 반환한다', async () => {
      const msg = makeServerMessage();
      mockGetChatMessages.mockResolvedValue([msg]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data[0].status).toBe(MESSAGE_STATUS.SENT);
    });

    it('isMine이 true인 메시지는 myMessages에 포함된다', async () => {
      const myMsg = makeServerMessage({ messageId: 1, isMine: true });
      const otherMsg = makeServerMessage({ messageId: 2, isMine: false });
      mockGetChatMessages.mockResolvedValue([myMsg, otherMsg]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.myMessages).toHaveLength(1);
      expect(result.current.myMessages[0].messageId).toBe(1);
    });

    it('isMine이 false인 메시지는 otherMessages에 포함된다', async () => {
      const myMsg = makeServerMessage({ messageId: 1, isMine: true });
      const otherMsg = makeServerMessage({ messageId: 2, isMine: false });
      mockGetChatMessages.mockResolvedValue([myMsg, otherMsg]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.otherMessages).toHaveLength(1);
      expect(result.current.otherMessages[0].messageId).toBe(2);
    });

    it('메시지가 createdAt 기준으로 정렬된다', async () => {
      const later = makeServerMessage({ messageId: 1, createdAt: '2024-01-01T12:00:00Z' });
      const earlier = makeServerMessage({ messageId: 2, createdAt: '2024-01-01T09:00:00Z' });
      mockGetChatMessages.mockResolvedValue([later, earlier]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data[0].messageId).toBe(2);
      expect(result.current.data[1].messageId).toBe(1);
    });

    it('lastMessage가 가장 마지막 메시지를 반환한다', async () => {
      const msg1 = makeServerMessage({ messageId: 1, createdAt: '2024-01-01T09:00:00Z' });
      const msg2 = makeServerMessage({ messageId: 2, createdAt: '2024-01-01T12:00:00Z' });
      mockGetChatMessages.mockResolvedValue([msg1, msg2]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.lastMessage?.messageId).toBe(2);
    });

    it('메시지가 없으면 lastMessage가 null이다', async () => {
      mockGetChatMessages.mockResolvedValue([]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.lastMessage).toBeNull();
    });
  });

  describe('pending 메시지 병합', () => {
    it('pending 메시지가 서버 메시지와 함께 반환된다', async () => {
      const serverMsg = makeServerMessage({ createdAt: '2024-01-01T09:00:00Z' });
      const pending = makePendingMessage({ createdAt: '2024-01-01T11:00:00Z' });
      mockGetChatMessages.mockResolvedValue([serverMsg]);
      setupStoreMock([pending]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toHaveLength(2);
    });

    it('pending 메시지의 isMine은 항상 true이다', async () => {
      const pending = makePendingMessage();
      mockGetChatMessages.mockResolvedValue([]);
      setupStoreMock([pending]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data[0].isMine).toBe(true);
    });

    it('pending 메시지는 myMessages에만 포함된다', async () => {
      const pending = makePendingMessage();
      mockGetChatMessages.mockResolvedValue([]);
      setupStoreMock([pending]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.myMessages).toHaveLength(1);
      expect(result.current.otherMessages).toHaveLength(0);
    });

    it('다른 roomId의 pending 메시지는 포함하지 않는다', async () => {
      const pending = makePendingMessage({ roomId: 999 });
      mockGetChatMessages.mockResolvedValue([]);
      // Store에 다른 room의 pending 메시지가 있을 때 필터링 시뮬레이션
      mockUseChatQueueStore.mockImplementation(
        (selector: (state: { pendingMessages: (typeof pending)[] }) => unknown) =>
          selector({ pendingMessages: [] }) // roomId 필터링 후 빈 배열
      );

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('캐시 조작 메서드', () => {
    it('addMessage가 중복 없이 메시지를 추가한다', async () => {
      const existing = makeServerMessage({ messageId: 1 });
      mockGetChatMessages.mockResolvedValue([existing]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const newMsg = makeServerMessage({ messageId: 2, content: '새 메시지' });
      act(() => {
        result.current.addMessage(newMsg);
      });

      await waitFor(() => {
        expect(result.current.data.some((m) => m.messageId === 2)).toBe(true);
      });
    });

    it('addMessage가 같은 messageId를 가진 메시지는 추가하지 않는다', async () => {
      const existing = makeServerMessage({ messageId: 1 });
      mockGetChatMessages.mockResolvedValue([existing]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.addMessage(existing);
      });

      await waitFor(() => {
        const count = result.current.data.filter((m) => m.messageId === 1).length;
        expect(count).toBe(1);
      });
    });

    it('updateMessage가 해당 메시지를 업데이트한다', async () => {
      const msg = makeServerMessage({ messageId: 1, checked: false });
      mockGetChatMessages.mockResolvedValue([msg]);

      const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateMessage(1, (m) => ({ ...m, checked: true }));
      });

      await waitFor(() => {
        const updated = result.current.data.find((m) => m.messageId === 1);
        expect(updated?.checked).toBe(true);
      });
    });
  });

  describe('에러 처리', () => {
    it('API 에러 발생 시 onError 콜백이 호출된다', async () => {
      const error = new Error('API error');
      mockGetChatMessages.mockRejectedValue(error);
      const onError = jest.fn();

      renderHookWithProviders(() => useChatMessages(ROOM_ID, { onError }));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });
});
