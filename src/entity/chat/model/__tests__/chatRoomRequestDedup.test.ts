import { act, waitFor } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { renderHookWithProviders } from '~/test-utils';
import { useChatMessages } from '../useChatMessages';
import { useChatRoomData } from '../useChatRoomData';
import { chatMessageKeys, chatRoomDataKeys } from '../chatQueryKeys';
import { getChatRoomData, CHAT_MESSAGE_PAGE_SIZE } from '../../api/getChatMessages';
import type { ChatMessagePages } from '../../lib/messageCache';

// 채팅방 진입 시 GET /chat/{roomId} 요청 횟수를 확인한다(#731)

jest.mock('../../api/getChatMessages', () => ({
  CHAT_MESSAGE_PAGE_SIZE: 30,
  getChatMessages: jest.fn(),
  getChatRoomData: jest.fn(),
}));

jest.mock('~/shared/store/useChatQueueStore', () => ({
  useChatQueueStore: (selector: (state: { pendingMessages: [] }) => unknown) =>
    selector({ pendingMessages: [] }),
  MESSAGE_STATUS: { PENDING: 'PENDING', SENDING: 'SENDING', FAILED: 'FAILED', SENT: 'SENT' },
}));

const mockGetChatRoomData = getChatRoomData as jest.Mock;
const ROOM_ID = 100;

const roomResponse = {
  product: null,
  messages: [
    {
      messageId: 1,
      roomId: ROOM_ID,
      content: '안녕',
      messageType: 'TEXT',
      createdAt: '2026-09-29T10:00:00Z',
      senderNickname: '상대방',
      senderId: 2,
      checked: true,
      isMine: false,
    },
  ],
};

// 응답이 오기 전까지 요청을 붙잡아 두어, 진행 중인 요청에 합류하는지 확인할 수 있게 한다
const deferredResponse = () => {
  let resolve!: (value: typeof roomResponse) => void;
  const promise = new Promise<typeof roomResponse>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const useChatRoomScreen = () => ({
  messages: useChatMessages(ROOM_ID),
  roomData: useChatRoomData({ roomId: ROOM_ID }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('채팅방 진입 요청 중복 제거', () => {
  it('메시지와 채팅방 데이터를 함께 마운트해도 GET /chat/{roomId}는 한 번만 요청한다', async () => {
    const deferred = deferredResponse();
    mockGetChatRoomData.mockReturnValue(deferred.promise);

    const { result } = renderHookWithProviders(() => useChatRoomScreen());
    deferred.resolve(roomResponse);

    await waitFor(() => expect(result.current.messages.data).toHaveLength(1));
    expect(result.current.roomData.data).toEqual(roomResponse);
    expect(mockGetChatRoomData).toHaveBeenCalledTimes(1);
  });

  it('채팅 목록에서 시작한 프리페치가 진행 중이면 그 요청에 합류한다', async () => {
    const deferred = deferredResponse();
    mockGetChatRoomData.mockReturnValue(deferred.promise);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    // ChatRoomList.handleChatRoomPress와 같은 프리페치
    const prefetch = queryClient.fetchQuery({
      queryKey: chatRoomDataKeys.room(ROOM_ID),
      queryFn: () => getChatRoomData(ROOM_ID),
      staleTime: 30 * 1000,
    });

    const { result } = renderHookWithProviders(() => useChatRoomScreen(), { queryClient });
    deferred.resolve(roomResponse);
    await prefetch;

    await waitFor(() => expect(result.current.messages.data).toHaveLength(1));
    expect(mockGetChatRoomData).toHaveBeenCalledTimes(1);
  });

  it('이미 끝난 캐시만 있으면 다시 들어올 때 최신 메시지를 새로 받아온다(#626)', async () => {
    mockGetChatRoomData.mockResolvedValue(roomResponse);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(chatRoomDataKeys.room(ROOM_ID), { product: null, messages: [] });

    const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID), { queryClient });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(mockGetChatRoomData).toHaveBeenCalledTimes(1);
  });
});

describe('이전 메시지 페이지 로드', () => {
  // 서버처럼 최신순으로 fromId부터 count개
  const makeMessages = (fromId: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const id = fromId - i;
      return {
        ...roomResponse.messages[0],
        messageId: id,
        createdAt: `2026-09-29T10:${String(id).padStart(2, '0')}:00`,
      };
    });

  it('최신 페이지가 가득 차 있으면 가장 오래된 메시지를 커서로 이전 페이지를 요청한다', async () => {
    const latest = makeMessages(59, CHAT_MESSAGE_PAGE_SIZE); // 59..30
    const older = makeMessages(29, 5); // 29..25
    mockGetChatRoomData
      .mockResolvedValueOnce({ product: null, messages: latest })
      .mockResolvedValueOnce({ product: null, messages: older });

    const { result } = renderHookWithProviders(() => useChatMessages(ROOM_ID));
    await waitFor(() => expect(result.current.data).toHaveLength(CHAT_MESSAGE_PAGE_SIZE));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    const oldestOfLatest = latest[latest.length - 1];
    expect(mockGetChatRoomData).toHaveBeenLastCalledWith(ROOM_ID, {
      cursor: { lastCreatedAt: oldestOfLatest.createdAt, lastMessageId: oldestOfLatest.messageId },
    });
    await waitFor(() => expect(result.current.data).toHaveLength(CHAT_MESSAGE_PAGE_SIZE + 5));
    expect(result.current.data[0].messageId).toBe(25);
    expect(result.current.data[result.current.data.length - 1].messageId).toBe(59);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('방을 나가면 쌓아 둔 이전 페이지를 버리고 최신 페이지만 남긴다', async () => {
    mockGetChatRoomData
      .mockResolvedValueOnce({ product: null, messages: makeMessages(59, CHAT_MESSAGE_PAGE_SIZE) })
      .mockResolvedValueOnce({ product: null, messages: makeMessages(29, 5) });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result, unmount } = renderHookWithProviders(() => useChatMessages(ROOM_ID), {
      queryClient,
    });
    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(
      queryClient.getQueryData<ChatMessagePages>(chatMessageKeys.room(ROOM_ID))?.pages
    ).toHaveLength(2);

    unmount();

    const cached = queryClient.getQueryData<ChatMessagePages>(chatMessageKeys.room(ROOM_ID));
    expect(cached?.pages).toHaveLength(1);
    expect(cached?.pageParams).toEqual([null]);
  });
});
