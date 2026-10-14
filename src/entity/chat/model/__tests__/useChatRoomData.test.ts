import { waitFor } from '@testing-library/react-native';
import { renderHookWithProviders } from '~/test-utils';
import {
  useChatRoomData,
  getChatRoomDataRefetchInterval,
  CHAT_ROOM_DATA_POLL_INTERVAL,
} from '../useChatRoomData';
import { getChatRoomData } from '../../api/getChatMessages';

jest.mock('../../api/getChatMessages', () => ({
  getChatRoomData: jest.fn(),
}));

const mockGetChatRoomData = getChatRoomData as jest.Mock;

const makeRoomData = () => ({
  product: null,
  messages: [],
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useChatRoomData', () => {
  it('roomId로 getChatRoomData를 호출한다', async () => {
    mockGetChatRoomData.mockResolvedValue(makeRoomData());

    const { result } = renderHookWithProviders(() => useChatRoomData({ roomId: 100 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetChatRoomData).toHaveBeenCalledWith(100);
  });

  it('성공 시 데이터를 반환한다', async () => {
    const data = makeRoomData();
    mockGetChatRoomData.mockResolvedValue(data);

    const { result } = renderHookWithProviders(() => useChatRoomData({ roomId: 100 }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(data);
  });

  it('enabled가 false이면 요청하지 않는다', () => {
    mockGetChatRoomData.mockResolvedValue(makeRoomData());

    renderHookWithProviders(() => useChatRoomData({ roomId: 100, enabled: false }));

    expect(mockGetChatRoomData).not.toHaveBeenCalled();
  });

  it('roomId가 없으면(falsy) 요청하지 않는다', () => {
    mockGetChatRoomData.mockResolvedValue(makeRoomData());

    renderHookWithProviders(() => useChatRoomData({ roomId: 0 }));

    expect(mockGetChatRoomData).not.toHaveBeenCalled();
  });

  it('API 실패 시 에러 상태가 된다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetChatRoomData.mockRejectedValue(new Error('Network error'));

    const { result } = renderHookWithProviders(() => useChatRoomData({ roomId: 100 }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('채팅방을 찾을 수 없는 404 에러가 나면 더 이상 폴링하지 않는다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetChatRoomData.mockRejectedValue(
      Object.assign(new Error('해당하는 채팅방을 찾을 수 없습니다.'), { status: 404 })
    );

    const { result } = renderHookWithProviders(() => useChatRoomData({ roomId: 100 }));

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockGetChatRoomData).toHaveBeenCalledTimes(1);
  });

  describe('폴링 간격', () => {
    it('기본으로 30초마다 폴링한다', () => {
      expect(getChatRoomDataRefetchInterval(null, false)).toBe(CHAT_ROOM_DATA_POLL_INTERVAL);
    });

    it('소켓이 연결되어 pausePolling이면 폴링하지 않는다', () => {
      expect(getChatRoomDataRefetchInterval(null, true)).toBe(false);
    });

    it('채팅방이 없어 404가 나면 폴링하지 않는다', () => {
      const error = Object.assign(new Error('없음'), { status: 404 });
      expect(getChatRoomDataRefetchInterval(error, false)).toBe(false);
    });

    it('404가 아닌 에러는 계속 폴링해 복구를 기다린다', () => {
      const error = Object.assign(new Error('서버 오류'), { status: 500 });
      expect(getChatRoomDataRefetchInterval(error, false)).toBe(CHAT_ROOM_DATA_POLL_INTERVAL);
    });
  });

  it('pausePolling이면 시간이 지나도 다시 요청하지 않는다', async () => {
    jest.useFakeTimers();
    try {
      mockGetChatRoomData.mockResolvedValue(makeRoomData());
      const { result } = renderHookWithProviders(() =>
        useChatRoomData({ roomId: 100, pausePolling: true })
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      jest.advanceTimersByTime(5 * 60 * 1000);

      expect(mockGetChatRoomData).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
