import { act, renderHook } from '@testing-library/react-native';
import { searchPlaces } from '~/shared/api/kakaoLocalSearch';
import { useKakaoPlaceSearch, SEARCH_DEBOUNCE_MS } from '../useKakaoPlaceSearch';

jest.mock('~/shared/api/kakaoLocalSearch', () => ({ searchPlaces: jest.fn() }));
jest.mock('~/shared/lib/logger', () => ({ logger: { error: jest.fn() } }));

const mockSearchPlaces = searchPlaces as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useKakaoPlaceSearch', () => {
  it('입력이 멈춘 뒤 한 번만 검색한다', async () => {
    mockSearchPlaces.mockResolvedValue([{ id: '1', place_name: '광산구청' }]);
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.changeSearchQuery('광'));
    act(() => result.current.changeSearchQuery('광산'));
    expect(mockSearchPlaces).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(mockSearchPlaces).toHaveBeenCalledTimes(1);
    expect(mockSearchPlaces).toHaveBeenCalledWith('광산');
    expect(result.current.suggestions).toEqual([{ id: '1', place_name: '광산구청' }]);
    expect(result.current.isSearching).toBe(false);
  });

  it('입력을 지우면 검색하지 않고 결과를 비운다', () => {
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.changeSearchQuery('   '));
    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(mockSearchPlaces).not.toHaveBeenCalled();
    expect(result.current.isSearchActive).toBe(false);
  });

  it('검색이 실패하면 결과를 비운다', async () => {
    mockSearchPlaces.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.changeSearchQuery('광산'));
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isSearching).toBe(false);
  });

  it('clearSearch는 입력과 결과를 함께 비운다', async () => {
    mockSearchPlaces.mockResolvedValue([{ id: '1' }]);
    const { result } = renderHook(() => useKakaoPlaceSearch());
    act(() => result.current.changeSearchQuery('광산'));
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    act(() => result.current.clearSearch());

    expect(result.current.searchQuery).toBe('');
    expect(result.current.suggestions).toEqual([]);
  });
});
