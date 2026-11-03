import { renderHookWithProviders, createQueryClient } from '~/test-utils';
import type { ChatMessageResponse, ChatRoomListItem } from '../chatTypes';
import { chatRoomKeys } from '../chatQueryKeys';
import { selectChatOtherUser, useChatOtherUser } from '../useChatOtherUser';
import type { RoomId } from '~/shared/types/chatType';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const ROOM_ID = 10 as RoomId;

const makeMessage = (overrides: Partial<ChatMessageResponse> = {}): ChatMessageResponse =>
  ({
    messageId: 1,
    roomId: ROOM_ID,
    content: '안녕하세요',
    messageType: 'TEXT',
    createdAt: '2026-01-01T00:00:00Z',
    images: [],
    senderNickname: '광산주민',
    senderId: 42,
    checked: false,
    isMine: false,
    ...overrides,
  }) as ChatMessageResponse;

const makeRoom = (overrides: Partial<ChatRoomListItem> = {}): ChatRoomListItem =>
  ({
    roomId: ROOM_ID,
    member: { memberId: 99, nickname: '목록닉네임' },
    ...overrides,
  }) as ChatRoomListItem;

describe('selectChatOtherUser', () => {
  it('채팅 목록에 방이 있으면 그 멤버 정보를 쓴다', () => {
    expect(selectChatOtherUser([makeRoom()], ROOM_ID, [makeMessage()])).toEqual({
      nickname: '목록닉네임',
      id: 99,
    });
  });

  it('채팅 목록에 방이 없으면 상대가 보낸 메시지에서 정보를 꺼낸다', () => {
    const messages = [makeMessage({ isMine: true, senderId: 1 }), makeMessage()];

    expect(selectChatOtherUser(undefined, ROOM_ID, messages)).toEqual({
      nickname: '광산주민',
      id: 42,
    });
  });

  it('정보가 전혀 없으면 기본 닉네임을 돌려준다', () => {
    expect(selectChatOtherUser([], ROOM_ID, [])).toEqual({ nickname: '상대방', id: undefined });
  });
});

describe('useChatOtherUser', () => {
  it('채팅 목록 캐시를 읽어 상대 정보를 돌려준다', () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(chatRoomKeys.list(), [makeRoom()]);

    const { result } = renderHookWithProviders(() => useChatOtherUser(ROOM_ID, undefined), {
      queryClient,
    });

    expect(result.current).toEqual({ nickname: '목록닉네임', id: 99 });
  });

  it('캐시가 없고 메시지도 아직 없으면 기본값을 돌려준다', () => {
    const { result } = renderHookWithProviders(() => useChatOtherUser(ROOM_ID, undefined));

    expect(result.current).toEqual({ nickname: '상대방', id: undefined });
  });
});
