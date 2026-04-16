import { renderHook, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from '../useNetworkStatus';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useNetworkStatus', () => {
  it('초기 상태는 연결됨(true)이다', () => {
    mockNetInfo.addEventListener.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toBe(true);
  });

  it('NetInfo.addEventListener를 마운트 시 등록한다', () => {
    mockNetInfo.addEventListener.mockReturnValue(jest.fn());

    renderHook(() => useNetworkStatus());

    expect(mockNetInfo.addEventListener).toHaveBeenCalledTimes(1);
  });

  it('네트워크 연결 해제 이벤트를 받으면 false로 변경된다', () => {
    let capturedListener: Parameters<typeof NetInfo.addEventListener>[0] | null = null;
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      capturedListener = listener;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      capturedListener!({ isConnected: false } as any);
    });

    expect(result.current).toBe(false);
  });

  it('네트워크 재연결 이벤트를 받으면 true로 변경된다', () => {
    let capturedListener: Parameters<typeof NetInfo.addEventListener>[0] | null = null;
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      capturedListener = listener;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      capturedListener!({ isConnected: false } as any);
    });
    act(() => {
      capturedListener!({ isConnected: true } as any);
    });

    expect(result.current).toBe(true);
  });

  it('isConnected가 null이면 false로 처리된다', () => {
    let capturedListener: Parameters<typeof NetInfo.addEventListener>[0] | null = null;
    mockNetInfo.addEventListener.mockImplementation((listener) => {
      capturedListener = listener;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      capturedListener!({ isConnected: null } as any);
    });

    expect(result.current).toBe(false);
  });

  it('언마운트 시 이벤트 리스너를 해제한다', () => {
    const unsubscribe = jest.fn();
    mockNetInfo.addEventListener.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
