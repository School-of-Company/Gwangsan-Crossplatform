import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { getCurrentLocation } from '~/shared/lib/getCurrentLocation';
import { getAddressName, searchNearbyPlaces, searchPlaces } from '~/shared/api/kakaoLocalSearch';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import { ReservationMapPage } from '../index';

const NEARBY_DEBOUNCE_MS = 500;
const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_CENTER = { latitude: 35.1397, longitude: 126.7938 };

// ---- expo-router ----
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));

// ---- expo-maps: capture props passed to AppleMaps.View (iOS path) ----
let lastAppleMapsProps: any = null;
jest.mock('expo-maps', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    AppleMaps: {
      View: (props: any) => {
        lastAppleMapsProps = props;
        return ReactActual.createElement(View, { testID: 'apple-maps-view' });
      },
    },
  };
});

// ---- KakaoMapWebView (Android path): capture props; it has its own dedicated test ----
let lastKakaoMapWebViewProps: any = null;
jest.mock('~/view/chat/ui/ReservationMapPage/KakaoMapWebView', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    KakaoMapWebView: (props: any) => {
      lastKakaoMapWebViewProps = props;
      return ReactActual.createElement(View, { testID: 'kakao-map-webview' });
    },
  };
});

// ---- ReservationPlaceNameSheet: capture props + expose a confirm trigger ----
let lastPlaceNameSheetProps: any = null;
jest.mock('~/view/chat/ui/ReservationPlaceNameSheet', () => {
  const ReactActual = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ReservationPlaceNameSheet: (props: any) => {
      lastPlaceNameSheetProps = props;
      return ReactActual.createElement(
        View,
        { testID: 'place-name-sheet' },
        ReactActual.createElement(
          Text,
          { testID: 'place-name-sheet-visible' },
          String(props.isVisible)
        ),
        ReactActual.createElement(Text, { testID: 'place-name-sheet-address' }, props.address),
        ReactActual.createElement(
          TouchableOpacity,
          { testID: 'place-name-sheet-confirm', onPress: props.onConfirm },
          ReactActual.createElement(Text, null, '시트확인')
        )
      );
    },
  };
});

jest.mock('~/shared/lib/getCurrentLocation', () => ({
  getCurrentLocation: jest.fn(),
}));

jest.mock('~/shared/api/kakaoLocalSearch', () => ({
  searchPlaces: jest.fn(),
  searchNearbyPlaces: jest.fn(),
  getAddressName: jest.fn(),
}));

jest.mock('~/shared/store/useReservationLocationStore', () => ({
  useReservationLocationStore: jest.fn(),
}));

jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// The real '~/shared/ui' barrel also re-exports Footer, which pulls in the
// chat entity -> axios -> AsyncStorage chain (native module, unavailable under
// Jest). Re-export the real, self-contained Header directly to sidestep that
// chain while keeping real Header behavior.
jest.mock('~/shared/ui', () => ({
  Header: require('~/shared/ui/Header').Header,
}));

const mockGetCurrentLocation = getCurrentLocation as jest.Mock;
const mockSearchNearbyPlaces = searchNearbyPlaces as jest.Mock;
const mockGetAddressName = getAddressName as jest.Mock;
const mockSearchPlaces = searchPlaces as jest.Mock;
const mockUseReservationLocationStore = useReservationLocationStore as unknown as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const mockSetCoordinates = jest.fn();
const mockSetPlaceName = jest.fn();
const mockRouterBack = jest.fn();

const makePlace = (overrides: Partial<Record<string, any>> = {}) => ({
  id: overrides.id ?? '1',
  place_name: overrides.place_name ?? '테스트 장소',
  category_name: overrides.category_name ?? '교통,수송 > 지하철,전철 > 광주1호선',
  address_name: overrides.address_name ?? '광주 광산구 테스트동 1',
  road_address_name: overrides.road_address_name ?? '광주 광산구 테스트로 1',
  x: overrides.x ?? '126.7938',
  y: overrides.y ?? '35.1397',
  distance: overrides.distance ?? '120',
  ...overrides,
});

// Promise/microtask flush helper: fetchNearbyPlaces/handleChangeSearchQuery chain
// through Promise.all + await, which resolve over several microtask ticks. Fake
// timers don't affect microtask scheduling, so repeatedly yielding inside act()
// lets those chains (and their resulting state updates) settle deterministically.
const flush = async (times = 6) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const setPlatform = (os: 'ios' | 'android') => {
  (Platform as any).OS = os;
};

describe('ReservationMapPage', () => {
  let originalPlatformOS: typeof Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalPlatformOS = Platform.OS;
    setPlatform('ios');

    lastAppleMapsProps = null;
    lastKakaoMapWebViewProps = null;
    lastPlaceNameSheetProps = null;

    mockGetCurrentLocation.mockResolvedValue({ latitude: 1, longitude: 2 });
    mockSearchNearbyPlaces.mockResolvedValue([]);
    mockGetAddressName.mockResolvedValue('');
    mockSearchPlaces.mockResolvedValue([]);
    mockUseReservationLocationStore.mockReturnValue({
      setCoordinates: mockSetCoordinates,
      setPlaceName: mockSetPlaceName,
    });
    mockUseRouter.mockReturnValue({ back: mockRouterBack });
  });

  afterEach(() => {
    setPlatform(originalPlatformOS as 'ios' | 'android');
    jest.useRealTimers();
  });

  it('위치 정보 조회에 성공하면 해당 좌표로 지도를 초기화하고 인근 장소를 조회한다', async () => {
    mockGetCurrentLocation.mockResolvedValue({ latitude: 10, longitude: 20 });
    mockSearchNearbyPlaces.mockResolvedValue([makePlace({ id: 'p1', place_name: '스타벅스' })]);
    mockGetAddressName.mockResolvedValue('광주 광산구 상무대로 100');

    const { getAllByText, getByText } = render(<ReservationMapPage />);
    await flush();

    expect(mockGetCurrentLocation).toHaveBeenCalled();
    expect(mockSearchNearbyPlaces).toHaveBeenCalledWith({ latitude: 10, longitude: 20 }, 1000);
    expect(mockGetAddressName).toHaveBeenCalledWith({ latitude: 10, longitude: 20 });
    // 같은 주소 문자열이 "입력" 캡션과 (항상 렌더링되는) 장소명 시트 mock 양쪽에 나타난다.
    expect(getAllByText('광주 광산구 상무대로 100').length).toBeGreaterThan(0);
    expect(getByText('스타벅스')).toBeTruthy();
  });

  it('위치 정보 조회에 실패하면 기본 좌표(광산구청)로 대체하고 인근 장소를 조회한다', async () => {
    mockGetCurrentLocation.mockRejectedValue(new Error('위치 권한이 필요합니다.'));

    render(<ReservationMapPage />);
    await flush();

    expect(mockSearchNearbyPlaces).toHaveBeenCalledWith(DEFAULT_CENTER, 1000);
    expect(mockGetAddressName).toHaveBeenCalledWith(DEFAULT_CENTER);
  });

  it('마지막으로 조회한 좌표와 동일하면 인근 장소를 다시 조회하지 않는다', async () => {
    setPlatform('android');
    const coordinate = { latitude: 10, longitude: 20 };
    mockGetCurrentLocation.mockResolvedValue(coordinate);

    render(<ReservationMapPage />);
    await flush();
    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);

    await act(async () => {
      lastKakaoMapWebViewProps.onCameraMove({ coordinates: coordinate });
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(NEARBY_DEBOUNCE_MS);
    });
    await flush();

    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);
  });

  it('오래된 요청이 나중에 응답해도(레이스) 최신 요청 결과만 반영한다', async () => {
    setPlatform('android');
    mockGetCurrentLocation.mockResolvedValue({ latitude: 0, longitude: 0 });

    const { queryByText, getByText } = render(<ReservationMapPage />);
    await flush();

    mockSearchNearbyPlaces.mockClear();

    let resolveFirst: (value: unknown) => void = () => {};
    let resolveSecond: (value: unknown) => void = () => {};
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });
    mockSearchNearbyPlaces.mockImplementationOnce(() => firstPromise);
    mockSearchNearbyPlaces.mockImplementationOnce(() => secondPromise);

    const coordA = { latitude: 11, longitude: 11 };
    const coordB = { latitude: 22, longitude: 22 };

    await act(async () => {
      lastKakaoMapWebViewProps.onCameraMove({ coordinates: coordA });
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(NEARBY_DEBOUNCE_MS);
    });

    await act(async () => {
      lastKakaoMapWebViewProps.onCameraMove({ coordinates: coordB });
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(NEARBY_DEBOUNCE_MS);
    });

    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(2);

    // 최신 요청(B)이 먼저 응답한다.
    resolveSecond([makePlace({ id: 'b', place_name: 'B장소' })]);
    await flush();
    expect(getByText('B장소')).toBeTruthy();

    // 오래된 요청(A)이 뒤늦게 응답해도 화면에는 반영되지 않아야 한다.
    resolveFirst([makePlace({ id: 'a', place_name: 'A장소' })]);
    await flush();

    expect(queryByText('A장소')).toBeNull();
    expect(getByText('B장소')).toBeTruthy();
  });

  it('getAddressName이 실패하면 가장 가까운 장소의 주소로 대체한다', async () => {
    const error = new Error('coord2address failed');
    mockGetCurrentLocation.mockResolvedValue({ latitude: 5, longitude: 6 });
    mockSearchNearbyPlaces.mockResolvedValue([
      makePlace({
        id: 'nearest',
        road_address_name: '광주 광산구 대체주소',
        place_name: '근처장소',
      }),
    ]);
    mockGetAddressName.mockRejectedValue(error);

    const { getAllByText } = render(<ReservationMapPage />);
    await flush();

    expect(logger.error).toHaveBeenCalledWith('getAddressName failed', error);
    expect(getAllByText('광주 광산구 대체주소').length).toBeGreaterThan(0);
  });

  it('searchNearbyPlaces 자체가 실패하면 주변 장소/주소를 비우고 에러를 로깅한다', async () => {
    const error = new Error('nearby search failed');
    mockGetCurrentLocation.mockResolvedValue({ latitude: 5, longitude: 6 });
    mockSearchNearbyPlaces.mockRejectedValue(error);
    mockGetAddressName.mockResolvedValue('무시되는 주소');

    const { getByText } = render(<ReservationMapPage />);
    await flush();

    expect(logger.error).toHaveBeenCalledWith('fetchNearbyPlaces failed', error);
    expect(getByText('주변 장소를 찾을 수 없어요.')).toBeTruthy();
    expect(getByText('주소를 찾을 수 없어요.')).toBeTruthy();
  });

  it('searchPlaces가 실패하면 에러를 로깅하고 검색 결과를 비운다', async () => {
    const error = new Error('search failed');
    mockSearchPlaces.mockRejectedValue(error);

    const { getByPlaceholderText, getByText } = render(<ReservationMapPage />);
    await flush();

    fireEvent.changeText(getByPlaceholderText('장소나 주소로 검색'), '실패검색');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    await flush();

    expect(logger.error).toHaveBeenCalledWith('searchPlaces failed', error);
    expect(getByText('검색 결과가 없어요.')).toBeTruthy();
  });

  it('장소명 입력 시트의 onClose를 호출하면 시트가 닫힌다', async () => {
    mockGetCurrentLocation.mockResolvedValue({ latitude: 7, longitude: 8 });
    mockGetAddressName.mockResolvedValue('광주 광산구 닫기로 1');

    const { getByText } = render(<ReservationMapPage />);
    await flush();

    fireEvent.press(getByText('이 주소에 대한 장소명 입력하기'));
    expect(lastPlaceNameSheetProps.isVisible).toBe(true);

    await act(async () => {
      lastPlaceNameSheetProps.onClose();
    });

    expect(lastPlaceNameSheetProps.isVisible).toBe(false);
  });

  it('검색어 입력 시 디바운스 이후에만 searchPlaces를 호출하고 결과를 보여준다', async () => {
    mockSearchPlaces.mockResolvedValue([makePlace({ id: 's1', place_name: '검색결과장소' })]);

    const { getByPlaceholderText, getByText, queryByText } = render(<ReservationMapPage />);
    await flush();

    fireEvent.changeText(getByPlaceholderText('장소나 주소로 검색'), '상무역');

    expect(mockSearchPlaces).not.toHaveBeenCalled();
    expect(queryByText('검색결과장소')).toBeNull();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    await flush();

    expect(mockSearchPlaces).toHaveBeenCalledWith('상무역');
    expect(getByText('검색결과장소')).toBeTruthy();
  });

  it('검색어를 지우면 API 호출 없이 즉시 검색 결과를 비운다', async () => {
    mockSearchPlaces.mockResolvedValue([makePlace({ id: 's1', place_name: '검색결과장소' })]);

    const { getByPlaceholderText, getByText, queryByText } = render(<ReservationMapPage />);
    await flush();

    const input = getByPlaceholderText('장소나 주소로 검색');
    fireEvent.changeText(input, '상무역');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    await flush();
    expect(getByText('검색결과장소')).toBeTruthy();
    expect(mockSearchPlaces).toHaveBeenCalledTimes(1);

    fireEvent.changeText(input, '');

    expect(queryByText('검색결과장소')).toBeNull();
    expect(mockSearchPlaces).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(mockSearchPlaces).toHaveBeenCalledTimes(1);
  });

  it('검색 결과를 선택하면 지도를 재중심하고 검색어/결과를 초기화한다', async () => {
    const suggestion = makePlace({
      id: 'sel',
      place_name: '선택할장소',
      x: '126.85',
      y: '35.2',
    });
    mockSearchPlaces.mockResolvedValue([suggestion]);
    mockSearchNearbyPlaces.mockResolvedValue([]);

    const { getByPlaceholderText, getByText, queryByText } = render(<ReservationMapPage />);
    await flush();

    fireEvent.changeText(getByPlaceholderText('장소나 주소로 검색'), '선택');
    await act(async () => {
      await jest.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    await flush();
    expect(getByText('선택할장소')).toBeTruthy();

    mockSearchNearbyPlaces.mockClear();
    fireEvent.press(getByText('선택할장소'));
    await flush();

    expect(queryByText('선택할장소')).toBeNull();
    expect(getByPlaceholderText('장소나 주소로 검색').props.value).toBe('');
    expect(mockSearchNearbyPlaces).toHaveBeenCalledWith(
      { latitude: 35.2, longitude: 126.85 },
      1000
    );
    expect(lastAppleMapsProps.cameraPosition).toEqual({
      coordinates: { latitude: 35.2, longitude: 126.85 },
      zoom: 15,
    });
  });

  it('Android 경로에서 지도 이동(handleCameraMove) 시 디바운스 후 인근 장소를 다시 조회한다', async () => {
    setPlatform('android');
    mockGetCurrentLocation.mockResolvedValue({ latitude: 1, longitude: 1 });

    render(<ReservationMapPage />);
    await flush();
    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);

    const movedCoordinate = { latitude: 9, longitude: 9 };
    await act(async () => {
      lastKakaoMapWebViewProps.onCameraMove({ coordinates: movedCoordinate });
    });

    // 디바운스 시간이 지나기 전에는 아직 재조회하지 않는다.
    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(NEARBY_DEBOUNCE_MS);
    });
    await flush();

    expect(mockSearchNearbyPlaces).toHaveBeenCalledTimes(2);
    expect(mockSearchNearbyPlaces).toHaveBeenLastCalledWith(movedCoordinate, 1000);
  });

  it('주변 장소를 선택하면 좌표/장소명을 저장하고 이전 화면으로 돌아간다', async () => {
    mockGetCurrentLocation.mockResolvedValue({ latitude: 3, longitude: 4 });
    mockSearchNearbyPlaces.mockResolvedValue([
      makePlace({
        id: 'nearby-1',
        place_name: '근처카페',
        road_address_name: '광주 광산구 근처로 1',
        x: '126.9',
        y: '35.3',
      }),
    ]);
    mockGetAddressName.mockResolvedValue('광주 광산구 근처로 1');

    const { getByText } = render(<ReservationMapPage />);
    await flush();

    fireEvent.press(getByText('근처카페'));

    expect(mockSetCoordinates).toHaveBeenCalledWith(35.3, 126.9, '광주 광산구 근처로 1');
    expect(mockSetPlaceName).toHaveBeenCalledWith('근처카페');
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('장소명 입력 시트를 열고, 입력값이 있으면 확인 시 저장 후 뒤로 간다', async () => {
    mockGetCurrentLocation.mockResolvedValue({ latitude: 7, longitude: 8 });
    mockGetAddressName.mockResolvedValue('광주 광산구 확인로 1');

    const { getByText, getByTestId } = render(<ReservationMapPage />);
    await flush();

    fireEvent.press(getByText('이 주소에 대한 장소명 입력하기'));

    expect(lastPlaceNameSheetProps.isVisible).toBe(true);
    expect(lastPlaceNameSheetProps.placeName).toBe('');

    await act(async () => {
      lastPlaceNameSheetProps.onChangePlaceName('상무역 2번 출구');
    });

    fireEvent.press(getByTestId('place-name-sheet-confirm'));

    expect(mockSetCoordinates).toHaveBeenCalledWith(7, 8, '광주 광산구 확인로 1');
    expect(mockSetPlaceName).toHaveBeenCalledWith('상무역 2번 출구');
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('입력값이 비어있으면 확인해도 아무 것도 저장하지 않는다', async () => {
    mockGetCurrentLocation.mockResolvedValue({ latitude: 7, longitude: 8 });
    mockGetAddressName.mockResolvedValue('광주 광산구 확인로 1');

    const { getByText, getByTestId } = render(<ReservationMapPage />);
    await flush();

    fireEvent.press(getByText('이 주소에 대한 장소명 입력하기'));
    fireEvent.press(getByTestId('place-name-sheet-confirm'));

    expect(mockSetCoordinates).not.toHaveBeenCalled();
    expect(mockSetPlaceName).not.toHaveBeenCalled();
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('아직 조회된 좌표가 없으면 확인해도 아무 것도 저장하지 않는다', async () => {
    // getCurrentLocation을 계속 pending 상태로 두어 lastFetchedCoordinateRef가 채워지지 않게 한다.
    mockGetCurrentLocation.mockImplementation(() => new Promise(() => {}));

    render(<ReservationMapPage />);
    await flush();

    await act(async () => {
      lastPlaceNameSheetProps.onChangePlaceName('아무개장소');
    });
    await act(async () => {
      lastPlaceNameSheetProps.onConfirm();
    });

    expect(mockSetCoordinates).not.toHaveBeenCalled();
    expect(mockSetPlaceName).not.toHaveBeenCalled();
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it('iOS에서는 AppleMaps.View를, Android에서는 KakaoMapWebView를 렌더링한다', async () => {
    setPlatform('ios');
    mockGetCurrentLocation.mockResolvedValue({ latitude: 1, longitude: 1 });

    const iosResult = render(<ReservationMapPage />);
    await flush();
    expect(iosResult.getByTestId('apple-maps-view')).toBeTruthy();
    expect(iosResult.queryByTestId('kakao-map-webview')).toBeNull();
    iosResult.unmount();

    setPlatform('android');
    const androidResult = render(<ReservationMapPage />);
    await flush();
    expect(androidResult.getByTestId('kakao-map-webview')).toBeTruthy();
    expect(androidResult.queryByTestId('apple-maps-view')).toBeNull();
  });
});
