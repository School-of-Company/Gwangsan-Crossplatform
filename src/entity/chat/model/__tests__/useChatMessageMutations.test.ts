import { act, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import Toast from 'react-native-toast-message';
import { renderHookWithProviders } from '~/test-utils';
import { useUpdateChatMessage } from '../useUpdateChatMessage';
import { useDeleteChatMessage } from '../useDeleteChatMessage';
import { updateChatMessage } from '../../api/updateChatMessage';
import { deleteChatMessage } from '../../api/deleteChatMessage';
import { chatMessageKeys } from '../chatQueryKeys';
import { chatRoomKeys } from '../useChatRooms';
import type { ChatMessageResponse, ChatRoomListItem } from '../chatTypes';

jest.mock('../../api/updateChatMessage', () => ({ updateChatMessage: jest.fn() }));
jest.mock('../../api/deleteChatMessage', () => ({ deleteChatMessage: jest.fn() }));
jest.mock('../useChatRooms', () => ({
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockUpdate = updateChatMessage as jest.Mock;
const mockDelete = deleteChatMessage as jest.Mock;

const ROOM_ID = 1;

const message = (messageId: number, content = `메시지 ${messageId}`): ChatMessageResponse => ({
  messageId,
  roomId: ROOM_ID,
  content,
  messageType: 'TEXT',
  createdAt: `2026-09-29T12:0${messageId}:00.000Z`,
  senderNickname: '나',
  senderId: 1,
  checked: false,
  isMine: true,
});

const room = (messageId: number, lastMessage: string): ChatRoomListItem => ({
  roomId: ROOM_ID,
  member: { memberId: 2, nickname: '상대방' },
  messageId,
  lastMessage,
  lastMessageType: 'TEXT',
  lastMessageTime: '2026-09-29T12:02:00.000Z',
  unreadMessageCount: 0,
  product: { productId: 1, title: '상품', images: [] },
});

const notFoundError = () =>
  new AxiosError('없음', '404', undefined, undefined, {
    status: 404,
    statusText: 'Not Found',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('useUpdateChatMessage', () => {
  it('수정 요청을 보내고 메시지 캐시에 수정 내용과 수정 시각을 반영한다', async () => {
    mockUpdate.mockResolvedValue(undefined);
    const { result, queryClient } = renderHookWithProviders(() => useUpdateChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);

    act(() => result.current.mutate({ messageId: 2, content: '고친 내용' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith(2, '고친 내용');
    const cached = queryClient.getQueryData<ChatMessageResponse[]>(chatMessageKeys.room(ROOM_ID));
    expect(cached?.[1].content).toBe('고친 내용');
    expect(cached?.[1].editedAt).toEqual(expect.any(String));
  });

  it('서버가 수정 시각을 돌려주면 그 값으로 맞춘다', async () => {
    mockUpdate.mockResolvedValue({ content: '서버 내용', editedAt: '2026-09-29T13:00:00.000Z' });
    const { result, queryClient } = renderHookWithProviders(() => useUpdateChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1)]);

    act(() => result.current.mutate({ messageId: 1, content: '내 내용' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      queryClient.getQueryData<ChatMessageResponse[]>(chatMessageKeys.room(ROOM_ID))?.[0]
    ).toEqual(
      expect.objectContaining({ content: '서버 내용', editedAt: '2026-09-29T13:00:00.000Z' })
    );
  });

  it('수정한 메시지가 채팅방 목록의 마지막 메시지면 미리보기도 바꾼다', async () => {
    mockUpdate.mockResolvedValue(undefined);
    const { result, queryClient } = renderHookWithProviders(() => useUpdateChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(2)]);
    queryClient.setQueryData(chatRoomKeys.list(), [room(2, '메시지 2')]);

    act(() => result.current.mutate({ messageId: 2, content: '고친 내용' }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData<ChatRoomListItem[]>(chatRoomKeys.list())?.[0].lastMessage).toBe(
      '고친 내용'
    );
  });

  it('실패하면 이전 내용으로 되돌리고 서버 에러 메시지를 토스트로 보여준다', async () => {
    mockUpdate.mockRejectedValue(new Error('24시간이 지난 메시지는 수정할 수 없습니다.'));
    const { result, queryClient } = renderHookWithProviders(() => useUpdateChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1)]);

    act(() => result.current.mutate({ messageId: 1, content: '고친 내용' }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(chatMessageKeys.room(ROOM_ID))).toEqual([message(1)]);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text2: '24시간이 지난 메시지는 수정할 수 없습니다.',
      })
    );
  });
});

describe('useDeleteChatMessage', () => {
  it('삭제 요청을 보내고 메시지 캐시에서 해당 메시지를 뺀다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);

    act(() => result.current.mutate(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDelete).toHaveBeenCalledWith(1);
    expect(queryClient.getQueryData(chatMessageKeys.room(ROOM_ID))).toEqual([message(2)]);
  });

  it('채팅방 목록의 마지막 메시지를 지우면 목록을 다시 받아온다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);
    queryClient.setQueryData(chatRoomKeys.list(), [room(2, '메시지 2')]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.mutate(2));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatRoomKeys.list() });
  });

  it('마지막 메시지가 아니면 목록을 다시 받아오지 않는다', async () => {
    mockDelete.mockResolvedValue(undefined);
    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);
    queryClient.setQueryData(chatRoomKeys.list(), [room(2, '메시지 2')]);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => result.current.mutate(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: chatRoomKeys.list() });
  });

  it('이미 지워진 메시지(404)는 실패로 되돌리지 않는다', async () => {
    mockDelete.mockRejectedValue(notFoundError());
    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);

    act(() => result.current.mutate(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(chatMessageKeys.room(ROOM_ID))).toEqual([message(2)]);
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('실패하면 지운 메시지를 되돌리고 토스트로 알린다', async () => {
    mockDelete.mockRejectedValue(new Error('권한이 없습니다.'));
    const { result, queryClient } = renderHookWithProviders(() => useDeleteChatMessage(ROOM_ID));
    queryClient.setQueryData(chatMessageKeys.room(ROOM_ID), [message(1), message(2)]);

    act(() => result.current.mutate(1));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(chatMessageKeys.room(ROOM_ID))).toEqual([
      message(1),
      message(2),
    ]);
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text2: '권한이 없습니다.' })
    );
  });
});
