import { waitFor } from '@testing-library/react-native';
import { QueryClient } from '@tanstack/react-query';
import { renderHookWithProviders } from '~/test-utils';
import { useChatMessages } from '../useChatMessages';
import { useChatRoomData } from '../useChatRoomData';
import { chatRoomDataKeys } from '../chatQueryKeys';
import { getChatRoomData } from '../../api/getChatMessages';

// 채팅방 진입 시 GET /chat/{roomId} 요청 횟수를 확인한다(#731)

jest.mock('../../api/getChatMessages', () => ({
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
