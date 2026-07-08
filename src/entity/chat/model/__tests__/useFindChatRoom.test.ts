import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useFindChatRoom } from '../useFindChatRoom';
import { findChatRoom } from '../../api/findChatRoom';
import Toast from 'react-native-toast-message';

jest.mock('../../api/findChatRoom', () => ({
  findChatRoom: jest.fn(),
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

const mockFindChatRoom = findChatRoom as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useFindChatRoom', () => {
  it('findRoom 호출 시 findChatRoom API를 productId와 함께 호출한다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 1 });

    const { result } = renderHookWithProviders(() => useFindChatRoom());

    act(() => {
      result.current.findRoom(5);
    });

    await waitFor(() => {
      expect(mockFindChatRoom).toHaveBeenCalledWith(5);
    });
  });

  it('성공 시 onSuccess 콜백을 호출한다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 1 });
    const onSuccess = jest.fn();

    const { result } = renderHookWithProviders(() => useFindChatRoom({ onSuccess }));

    act(() => {
      result.current.findRoom(5);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ roomId: 1 });
    });
  });

  it('성공 시 채팅방 목록 쿼리를 invalidate한다', async () => {
    mockFindChatRoom.mockResolvedValue({ roomId: 1 });

    const { result, queryClient } = renderHookWithProviders(() => useFindChatRoom());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => {
      result.current.findRoom(5);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chatRooms', 'list'] });
    });
  });

  it('실패 시 status가 404이면 정보 토스트를 보여준다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('없음'), { status: 404 });
    mockFindChatRoom.mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHookWithProviders(() => useFindChatRoom({ onError }));

    act(() => {
      result.current.findRoom(5);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'info', text1: '채팅방 없음' })
    );
  });

  it('실패 시 status가 404가 아니면 에러 토스트를 보여준다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('서버 에러'), { status: 500 });
    mockFindChatRoom.mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHookWithProviders(() => useFindChatRoom({ onError }));

    act(() => {
      result.current.findRoom(5);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text2: '서버 에러' })
    );
  });
});
