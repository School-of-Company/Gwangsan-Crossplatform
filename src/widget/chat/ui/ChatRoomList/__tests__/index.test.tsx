import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import { renderWithProviders as render } from '~/test-utils';
import { ChatRoomList } from '../index';
import {
  useChatRooms,
  useChatSocket,
  useDeleteChatRoom,
  chatRoomKeys,
  getChatRoomData,
} from '@/entity/chat';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/entity/chat', () => ({
  useChatRooms: jest.fn(),
  useChatSocket: jest.fn(),
  useDeleteChatRoom: jest.fn(),
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
  chatMessageKeys: { all: ['chatMessages'], room: (roomId: unknown) => ['chatMessages', roomId] },
  getChatRoomData: jest.fn(),
  ChatRoomItem: ({ room, onPress, onLongPress }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID={`room-${room.roomId}`}
        onPress={() => onPress(room.roomId)}
        onLongPress={() => onLongPress?.(room.roomId)}>
        <Text>{room.nickname}</Text>
      </TouchableOpacity>
    );
  },
}));

const mockUseChatRooms = useChatRooms as jest.Mock;
const mockUseChatSocket = useChatSocket as jest.Mock;
const mockUseDeleteChatRoom = useDeleteChatRoom as jest.Mock;
const mockGetChatRoomData = getChatRoomData as jest.Mock;
const mockJoinRoom = jest.fn();
const mockDeleteMutate = jest.fn();

const makeChatRoomsReturn = (overrides: Record<string, unknown> = {}) => ({
  data: [],
  isLoading: false,
  refetch: jest.fn(),
  isError: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseChatRooms.mockReturnValue(makeChatRoomsReturn());
  mockUseChatSocket.mockReturnValue({ joinRoom: mockJoinRoom });
  mockUseDeleteChatRoom.mockReturnValue({ mutate: mockDeleteMutate, isPending: false });
  mockGetChatRoomData.mockResolvedValue({ product: null, messages: [] });
});

describe('ChatRoomList', () => {
  it('isError=true이면 에러 상태를 표시한다', () => {
    mockUseChatRooms.mockReturnValue(makeChatRoomsReturn({ isError: true }));

    const { getByText } = render(<ChatRoomList />);

    expect(getByText('채팅방 목록을 불러올 수 없습니다')).toBeTruthy();
  });

  it('채팅방이 없으면 빈 상태를 표시한다', () => {
    const { getByText } = render(<ChatRoomList />);

    expect(getByText('아직 채팅방 없습니다')).toBeTruthy();
  });

  it('채팅방 목록을 렌더링한다', () => {
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({
        data: [
          { roomId: 1, nickname: '방장1' },
          { roomId: 2, nickname: '방장2' },
        ],
      })
    );

    const { getByTestId } = render(<ChatRoomList />);

    expect(getByTestId('room-1')).toBeTruthy();
    expect(getByTestId('room-2')).toBeTruthy();
  });

  it('채팅방을 누르면 해당 채팅방으로 이동한다', () => {
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({ data: [{ roomId: 7, nickname: '방장' }] })
    );

    const { getByTestId } = render(<ChatRoomList />);

    fireEvent.press(getByTestId('room-7'));

    expect(mockPush).toHaveBeenCalledWith('/chatting/7');
  });

  it('채팅방을 누르면 데이터를 미리 받아오고 소켓 방에 미리 join한다', async () => {
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({ data: [{ roomId: 7, nickname: '방장' }] })
    );

    const { getByTestId } = render(<ChatRoomList />);

    fireEvent.press(getByTestId('room-7'));

    expect(mockJoinRoom).toHaveBeenCalledWith(7);
    expect(mockGetChatRoomData).toHaveBeenCalledWith(7);
    await waitFor(() => expect(mockGetChatRoomData).toHaveBeenCalledTimes(1));
  });

  it('isLoading=true이면 RefreshControl의 refreshing이 true이다', () => {
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({ data: [{ roomId: 1, nickname: '방장' }], isLoading: true })
    );

    const { UNSAFE_getByType } = render(<ChatRoomList />);

    const refreshControl = UNSAFE_getByType(FlatList).props.refreshControl;
    expect(refreshControl.props.refreshing).toBe(true);
  });

  it('당겨서 새로고침 시 refetch가 호출된다', () => {
    const refetch = jest.fn();
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({ data: [{ roomId: 1, nickname: '방장' }], refetch })
    );

    const { UNSAFE_getByType } = render(<ChatRoomList />);

    const refreshControlElement = UNSAFE_getByType(FlatList).props.refreshControl;
    refreshControlElement.props.onRefresh();

    expect(refetch).toHaveBeenCalled();
  });

  it('useChatSocket을 autoConnect와 chatRoomQueryKey로 호출한다', () => {
    render(<ChatRoomList />);

    expect(mockUseChatSocket).toHaveBeenCalledWith({
      autoConnect: true,
      chatRoomQueryKey: chatRoomKeys.list(),
    });
  });

  it('data가 undefined이면 빈 배열로 렌더링한다', () => {
    mockUseChatRooms.mockReturnValue(makeChatRoomsReturn({ data: undefined }));

    const { UNSAFE_getByType } = render(<ChatRoomList />);

    expect(UNSAFE_getByType(FlatList).props.data).toEqual([]);
  });

  describe('채팅방 삭제', () => {
    beforeEach(() => {
      mockUseChatRooms.mockReturnValue(
        makeChatRoomsReturn({ data: [{ roomId: 7, nickname: '방장' }] })
      );
    });

    it('채팅방을 길게 누르면 삭제 확인 모달을 표시한다', () => {
      const { getByTestId, getByText } = render(<ChatRoomList />);

      fireEvent(getByTestId('room-7'), 'longPress');

      expect(getByText(/채팅방을 삭제하시겠어요/)).toBeTruthy();
    });

    it('삭제를 확인하면 해당 roomId로 삭제 mutation을 호출한다', () => {
      const { getByTestId, getByText } = render(<ChatRoomList />);

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('삭제'));

      expect(mockDeleteMutate).toHaveBeenCalledWith(7);
    });

    it('취소하면 삭제 mutation을 호출하지 않는다', () => {
      const { getByTestId, getByText } = render(<ChatRoomList />);

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('취소'));

      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });
  });
});
