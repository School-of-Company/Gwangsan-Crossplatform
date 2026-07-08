import { act, waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import { useCreateChatRoom } from '../useCreateChatRoom';
import { createChatRoom } from '../../api/createChatRoom';
import Toast from 'react-native-toast-message';

jest.mock('../../api/createChatRoom', () => ({
  createChatRoom: jest.fn(),
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

const mockCreateChatRoom = createChatRoom as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCreateChatRoom', () => {
  it('createRoom 호출 시 createChatRoom API를 productId와 함께 호출한다', async () => {
    mockCreateChatRoom.mockResolvedValue({ roomId: 1 });

    const { result } = renderHookWithProviders(() => useCreateChatRoom());

    act(() => {
      result.current.createRoom(5);
    });

    await waitFor(() => {
      expect(mockCreateChatRoom).toHaveBeenCalledWith(5);
    });
  });

  it('성공 시 성공 토스트를 보여주고 onSuccess 콜백을 호출한다', async () => {
    mockCreateChatRoom.mockResolvedValue({ roomId: 1 });
    const onSuccess = jest.fn();

    const { result } = renderHookWithProviders(() => useCreateChatRoom({ onSuccess }));

    act(() => {
      result.current.createRoom(5);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ roomId: 1 });
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success', text1: '채팅방 생성 완료' })
    );
  });

  it('성공 시 채팅방 목록 쿼리를 invalidate한다', async () => {
    mockCreateChatRoom.mockResolvedValue({ roomId: 1 });

    const { result, queryClient } = renderHookWithProviders(() => useCreateChatRoom());
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    act(() => {
      result.current.createRoom(5);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chatRooms', 'list'] });
    });
  });

  it('실패 시 에러 토스트를 보여주고 onError 콜백을 호출한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = Object.assign(new Error('생성 실패'), { status: 500 });
    mockCreateChatRoom.mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHookWithProviders(() => useCreateChatRoom({ onError }));

    act(() => {
      result.current.createRoom(5);
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '채팅방 생성 실패', text2: '생성 실패' })
    );
  });
});
