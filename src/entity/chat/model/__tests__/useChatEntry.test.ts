import { act, waitFor } from '@testing-library/react-native';
import { createQueryClient, renderHookWithProviders } from '~/test-utils';
import { useChatEntry } from '../useChatEntry';
import { findChatRoom } from '../../api/findChatRoom';
import { createChatRoom } from '../../api/createChatRoom';
import { getChatRooms } from '../../api/getChatRooms';
import { getChatRoomData } from '../../api/getChatMessages';
import { chatMessageKeys } from '../chatQueryKeys';
import { chatRoomKeys } from '../useChatRooms';
import Toast from 'react-native-toast-message';
import { AxiosError, AxiosHeaders } from 'axios';

jest.mock('../../api/findChatRoom', () => ({ findChatRoom: jest.fn() }));
jest.mock('../../api/createChatRoom', () => ({ createChatRoom: jest.fn() }));
jest.mock('../../api/getChatRooms', () => ({ getChatRooms: jest.fn() }));
jest.mock('../../api/getChatMessages', () => ({
  CHAT_MESSAGE_PAGE_SIZE: 30,
  getChatRoomData: jest.fn(),
}));
jest.mock('../useChatRooms', () => ({
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

// 서버가 채팅방이 없을 때 내려주는 404. 판단은 문구가 아니라 상태 코드로 한다(#739)
const notFoundError = (message = '해당하는 채팅방을 찾을 수 없습니다.') =>
  new AxiosError(message, '404', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockFindChatRoom = findChatRoom as jest.Mock;
const mockCreateChatRoom = createChatRoom as jest.Mock;
const mockGetChatRooms = getChatRooms as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetChatRooms.mockResolvedValue([]);
});

describe('useChatEntry', () => {
  it('초기 상태: isLoading이 false이다', () => {
    const { result } = renderHookWithProviders(() => useChatEntry());

    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 성공 시 해당 채팅방으로 이동한다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 'room-42' });

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(1);
    });

    expect(mockFindChatRoom).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith('/chatting/room-42');
    expect(result.current.isLoading).toBe(false);
  });

  it('채팅방 이동 전 채팅목록 캐시를 채워 상대방 정보가 정확히 표시되도록 한다', async () => {
    const rooms = [{ roomId: 'room-42', member: { memberId: 7, nickname: '판매자' } }];
    mockFindChatRoom.mockResolvedValue({ roomId: 'room-42' });
    mockGetChatRooms.mockResolvedValue(rooms);

    const { result, queryClient } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(1);
    });

    expect(mockGetChatRooms).toHaveBeenCalled();
    expect(queryClient.getQueryData(chatRoomKeys.list())).toEqual(rooms);
    expect(mockPush).toHaveBeenCalledWith('/chatting/room-42');
  });

  it('채팅목록 캐시 채우기가 실패해도 채팅방 이동은 계속 진행된다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 'room-42' });
    mockGetChatRooms.mockRejectedValue(new Error('네트워크 오류'));

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(1);
    });

    expect(mockPush).toHaveBeenCalledWith('/chatting/room-42');
  });

  it('findChatRoom 실패(방 없음) 시 createChatRoom을 호출한다', async () => {
    mockFindChatRoom.mockRejectedValue(notFoundError());
    mockCreateChatRoom.mockResolvedValue({ roomId: 'new-room-1' });

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(2);
    });

    expect(mockCreateChatRoom).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith('/chatting/new-room-1');
    expect(result.current.isLoading).toBe(false);
  });

  it('findChatRoom 실패(방 없음) + createChatRoom 실패 시 error Toast를 표시한다', async () => {
    mockFindChatRoom.mockRejectedValue(notFoundError());
    mockCreateChatRoom.mockRejectedValue(new Error('채팅방 생성 실패'));

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(3);
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '채팅방 생성 실패' })
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('서버 문구가 바뀌어도 404면 채팅방을 새로 만든다(#739)', async () => {
    mockFindChatRoom.mockRejectedValue(notFoundError('Chat room not found'));
    mockCreateChatRoom.mockResolvedValue({ roomId: 'new-room-2' });

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(4);
    });

    expect(mockCreateChatRoom).toHaveBeenCalledWith(4);
    expect(mockPush).toHaveBeenCalledWith('/chatting/new-room-2');
  });

  it('findChatRoom 기타 에러 시 error Toast를 표시한다', async () => {
    mockFindChatRoom.mockRejectedValue(new Error('서버 오류'));

    const { result } = renderHookWithProviders(() => useChatEntry());

    await act(async () => {
      await result.current.navigateToChat(4);
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '서버 오류' })
    );
    expect(mockCreateChatRoom).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('navigateToChat 호출 중 isLoading이 true가 된다', async () => {
    let resolveFind!: (value: any) => void;
    mockFindChatRoom.mockReturnValue(new Promise((res) => (resolveFind = res)));

    const { result } = renderHookWithProviders(() => useChatEntry());

    act(() => {
      result.current.navigateToChat(5);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveFind({ roomId: 'room-5' });
    });

    expect(result.current.isLoading).toBe(false);
  });

  describe('rejoinChat (명시적 재참여)', () => {
    it('findChatRoom을 거치지 않고 바로 createChatRoom을 호출해 이동한다', async () => {
      mockCreateChatRoom.mockResolvedValue({ roomId: 'room-99' });

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.rejoinChat(10);
      });

      expect(mockCreateChatRoom).toHaveBeenCalledWith(10);
      expect(mockFindChatRoom).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/chatting/room-99');
      expect(result.current.isLoading).toBe(false);
    });

    it('createChatRoom 실패 시 이동하지 않고 에러 토스트를 한 번 띄운다(#739)', async () => {
      mockCreateChatRoom.mockRejectedValue(new Error('채팅방 생성 실패'));

      const { result } = renderHookWithProviders(() => useChatEntry());

      await act(async () => {
        await result.current.rejoinChat(11);
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(Toast.show).toHaveBeenCalledTimes(1);
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text2: '채팅방 생성 실패' })
      );
      expect(result.current.isLoading).toBe(false);
    });

    it('rejoinChat 호출 중 isLoading이 true가 된다', async () => {
      let resolveCreate!: (value: any) => void;
      mockCreateChatRoom.mockReturnValue(new Promise((res) => (resolveCreate = res)));

      const { result } = renderHookWithProviders(() => useChatEntry());

      act(() => {
        result.current.rejoinChat(12);
      });

      await waitFor(() => expect(result.current.isLoading).toBe(true));

      await act(async () => {
        resolveCreate({ roomId: 'room-12' });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('prefetchRoom', () => {
    const mockGetChatRoomData = getChatRoomData as jest.Mock;
    const message = (messageId: number, createdAt: string) => ({
      messageId,
      roomId: 7,
      content: `메시지 ${messageId}`,
      messageType: 'TEXT',
      createdAt,
      isMine: false,
    });

    it('채팅방 데이터를 받아 메시지 캐시를 최신 페이지로 채운다', async () => {
      mockGetChatRoomData.mockResolvedValue({
        product: null,
        messages: [message(1, '2026-01-01T00:00:00')],
      });
      const queryClient = createQueryClient();
      const { result } = renderHookWithProviders(() => useChatEntry(), { queryClient });

      act(() => result.current.prefetchRoom(7));

      await waitFor(() =>
        expect(queryClient.getQueryData(chatMessageKeys.room(7))).toEqual({
          pages: [{ messages: [message(1, '2026-01-01T00:00:00')], nextCursor: null }],
          pageParams: [null],
        })
      );
    });

    it('기존 캐시가 더 최신이면(방금 보낸 메시지) 덮어쓰지 않는다(#610)', async () => {
      mockGetChatRoomData.mockResolvedValue({
        product: null,
        messages: [message(1, '2026-01-01T00:00:00')],
      });
      const queryClient = createQueryClient();
      const fresh = {
        pages: [{ messages: [message(2, '2026-01-01T00:10:00')], nextCursor: null }],
        pageParams: [null],
      };
      queryClient.setQueryData(chatMessageKeys.room(7), fresh);
      const { result } = renderHookWithProviders(() => useChatEntry(), { queryClient });

      await act(async () => {
        result.current.prefetchRoom(7);
      });
      await waitFor(() => expect(mockGetChatRoomData).toHaveBeenCalledWith(7));

      expect(queryClient.getQueryData(chatMessageKeys.room(7))).toBe(fresh);
    });

    it('조회가 실패해도 예외를 던지지 않는다', async () => {
      mockGetChatRoomData.mockRejectedValue(new Error('network'));
      const { result } = renderHookWithProviders(() => useChatEntry());

      expect(() => act(() => result.current.prefetchRoom(7))).not.toThrow();
      await waitFor(() => expect(mockGetChatRoomData).toHaveBeenCalled());
    });
  });
});
