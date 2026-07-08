import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import { ChatRoomList } from '../index';
import { useChatRooms, useChatSocket, chatRoomKeys } from '@/entity/chat';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/entity/chat', () => ({
  useChatRooms: jest.fn(),
  useChatSocket: jest.fn(),
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
  ChatRoomItem: ({ room, onPress }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID={`room-${room.roomId}`} onPress={() => onPress(room.roomId)}>
        <Text>{room.nickname}</Text>
      </TouchableOpacity>
    );
  },
}));

const mockUseChatRooms = useChatRooms as jest.Mock;
const mockUseChatSocket = useChatSocket as jest.Mock;

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
  mockUseChatSocket.mockReturnValue({});
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
});
