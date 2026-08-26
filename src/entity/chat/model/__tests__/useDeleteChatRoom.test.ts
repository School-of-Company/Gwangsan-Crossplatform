import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useDeleteChatRoom } from '../useDeleteChatRoom';
import { deleteChatRoom } from '../../api/deleteChatRoom';
import { chatRoomKeys } from '../useChatRooms';
import Toast from 'react-native-toast-message';
import type { ChatRoomListItem } from '../chatTypes';

jest.mock('../../api/deleteChatRoom', () => ({
  deleteChatRoom: jest.fn(),
}));

jest.mock('../useChatRooms', () => ({
  chatRoomKeys: {
    all: ['chatRooms'],
    list: () => ['chatRooms', 'list'],
  },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockDeleteChatRoom = deleteChatRoom as jest.Mock;

const room = (roomId: number): ChatRoomListItem => ({
  roomId,
  member: { memberId: 1, nickname: '상대방' },
  messageId: 1,
  lastMessage: '안녕하세요',
  lastMessageType: 'TEXT',
  lastMessageTime: '2026-05-28T01:00:00.000Z',
  unreadMessageCount: 0,
  product: { productId: 1, title: '상품', images: [] },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeleteChatRoom', () => {
  it('mutate 호출 시 deleteChatRoom API를 roomId와 함께 호출한다', async () => {
    mockDeleteChatRoom.mockResolvedValue(undefined);

    const { result } = renderHookWithProviders(() => useDeleteChatRoom());

    act(() => {
      result.current.mutate(7);
    });

    await waitFor(() => {
      expect(mockDeleteChatRoom).toHaveBeenCalledWith(7);
    });
  });

  it('성공 시 채팅방 목록 캐시에서 해당 방을 제거한다', async () => {
    mockDeleteChatRoom.mockResolvedValue(undefined);

    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatRoom());
    queryClient.setQueryData(chatRoomKeys.list(), [room(1), room(2)]);

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(chatRoomKeys.list())).toEqual([room(2)]);
    });
  });

  it('성공 시 성공 토스트를 보여준다', async () => {
    mockDeleteChatRoom.mockResolvedValue(undefined);

    const { result } = renderHookWithProviders(() => useDeleteChatRoom());

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '채팅방을 나갔습니다.' })
      );
    });
  });

  it('실패 시 mutation 에러 상태를 노출한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteChatRoom.mockRejectedValue(new Error('삭제 실패'));

    const { result } = renderHookWithProviders(() => useDeleteChatRoom());

    act(() => {
      result.current.mutate(1);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(Toast.show).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });
});
