import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import { renderWithProviders as render } from '~/test-utils';
import { ChatRoomList } from '../index';
import { BottomSheetPortalOutlet } from '~/shared/ui/BottomSheetPortalOutlet';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';
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

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('@/entity/chat', () => ({
  useChatRooms: jest.fn(),
  useChatSocket: jest.fn(),
  useDeleteChatRoom: jest.fn(),
  chatRoomKeys: { all: ['chatRooms'], list: () => ['chatRooms', 'list'] },
  chatMessageKeys: { all: ['chatMessages'], room: (roomId: unknown) => ['chatMessages', roomId] },
  getChatRoomData: jest.fn(),
  ChatRoomItem: ({ room, onPress, onLongPress, isExiting, onExited }: any) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity, View, Text } = require('react-native');
    return (
      <View>
        <TouchableOpacity
          testID={`room-${room.roomId}`}
          onPress={() => onPress(room.roomId)}
          onLongPress={() => onLongPress?.(room.roomId)}>
          <Text>{room.nickname}</Text>
        </TouchableOpacity>
        {isExiting && (
          <TouchableOpacity
            testID={`exit-complete-${room.roomId}`}
            onPress={() => onExited(room.roomId)}>
            <Text>exiting</Text>
          </TouchableOpacity>
        )}
      </View>
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
  useBottomSheetPortalStore.getState().reset();
});

describe('ChatRoomList', () => {
  it('isError=true이고 캐시된 목록도 없으면 에러 상태를 표시한다', () => {
    mockUseChatRooms.mockReturnValue(makeChatRoomsReturn({ isError: true }));

    const { getByText } = render(<ChatRoomList />);

    expect(getByText('오류가 발생했습니다')).toBeTruthy();
  });

  it('에러 상태에서 다시 시도를 누르면 refetch한다', () => {
    const refetch = jest.fn();
    mockUseChatRooms.mockReturnValue(makeChatRoomsReturn({ isError: true, refetch }));

    const { getByText } = render(<ChatRoomList />);
    fireEvent.press(getByText('다시 시도'));

    expect(refetch).toHaveBeenCalled();
  });

  it('isError=true여도 캐시된 목록이 있으면 목록을 계속 보여준다', () => {
    mockUseChatRooms.mockReturnValue(
      makeChatRoomsReturn({ isError: true, data: [{ roomId: 1, nickname: '방장1' }] })
    );

    const { getByTestId, queryByText } = render(<ChatRoomList />);

    expect(getByTestId('room-1')).toBeTruthy();
    expect(queryByText('오류가 발생했습니다')).toBeNull();
  });

  it('로딩 중에는 빈 상태 문구를 표시하지 않는다', () => {
    mockUseChatRooms.mockReturnValue(makeChatRoomsReturn({ data: [], isLoading: true }));

    const { queryByText } = render(<ChatRoomList />);

    expect(queryByText('아직 채팅방 없습니다')).toBeNull();
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

    it('채팅방을 길게 누르면 삭제 확인 바텀시트를 표시한다', () => {
      const { getByTestId, getByText } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');

      expect(getByText('채팅방 나가기')).toBeTruthy();
    });

    it('삭제를 확인하면 슬라이드 아웃 애니메이션이 끝난 뒤에 해당 roomId로 삭제 mutation을 호출한다', () => {
      const { getByTestId, getByText } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('채팅방 나가기'));

      // 애니메이션이 API 응답과 무관하게 먼저 재생되어야 하므로, 이 시점에는 아직 mutation이 호출되지 않는다.
      expect(mockDeleteMutate).not.toHaveBeenCalled();

      fireEvent.press(getByTestId('exit-complete-7'));

      expect(mockDeleteMutate).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ onError: expect.any(Function) })
      );
    });

    it('취소하면 삭제 mutation을 호출하지 않는다', () => {
      const { getByTestId, getByText } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('닫기'));

      expect(mockDeleteMutate).not.toHaveBeenCalled();
    });

    it('삭제를 확인하면 해당 채팅방이 슬라이드 아웃되는 동안에도 목록에는 남아있다', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('채팅방 나가기'));

      expect(queryByTestId('room-7')).toBeTruthy();
      expect(queryByTestId('exit-complete-7')).toBeTruthy();
    });

    it('슬라이드 아웃 애니메이션이 끝난 뒤에만 목록에서 해당 채팅방이 제거된다', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('채팅방 나가기'));
      fireEvent.press(getByTestId('exit-complete-7'));

      expect(queryByTestId('room-7')).toBeNull();
    });

    it('나가기가 실패하면 슬라이드 아웃으로 숨겼던 채팅방을 다시 표시한다', () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <>
          <ChatRoomList />
          <BottomSheetPortalOutlet />
        </>
      );

      fireEvent(getByTestId('room-7'), 'longPress');
      fireEvent.press(getByText('채팅방 나가기'));
      fireEvent.press(getByTestId('exit-complete-7'));
      expect(queryByTestId('room-7')).toBeNull();

      const [, options] = mockDeleteMutate.mock.calls[0];
      act(() => {
        options.onError();
      });

      expect(queryByTestId('room-7')).toBeTruthy();
    });
  });
});
