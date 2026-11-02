import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { ReservationLocationPage } from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

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

let lastKakaoProps: any = null;
jest.mock('~/view/chat/ui/ReservationLocationPage/KakaoMapMarkerWebView', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    KakaoMapMarkerWebView: (props: any) => {
      lastKakaoProps = props;
      return ReactActual.createElement(View, { testID: 'kakao-marker-webview' });
    },
  };
});

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const originalOS = Platform.OS;
const setPlatform = (os: 'ios' | 'android') => {
  (Platform as any).OS = os;
};

beforeEach(() => {
  lastAppleMapsProps = null;
  lastKakaoProps = null;
  setPlatform('ios');
});

afterAll(() => setPlatform(originalOS as 'ios' | 'android'));

describe('ReservationLocationPage', () => {
  it('iOS에서는 Apple 지도에 약속 장소 마커를 표시한다', () => {
    mockUseLocalSearchParams.mockReturnValue({
      latitude: '35.1',
      longitude: '126.8',
      placeName: '상무역 2번 출구',
    });

    const { getByTestId, getAllByText } = render(<ReservationLocationPage />);

    expect(getByTestId('apple-maps-view')).toBeTruthy();
    const center = { latitude: 35.1, longitude: 126.8 };
    expect(lastAppleMapsProps.cameraPosition).toEqual({ coordinates: center, zoom: 16 });
    expect(lastAppleMapsProps.markers).toEqual([
      { coordinates: center, title: '상무역 2번 출구', tintColor: '#8FC31D' },
    ]);
    // 헤더 제목과 하단 장소명 두 군데에 보인다.
    expect(getAllByText('상무역 2번 출구')).toHaveLength(2);
  });

  it('Android에서는 카카오 지도 WebView에 좌표와 장소명을 넘긴다', () => {
    setPlatform('android');
    mockUseLocalSearchParams.mockReturnValue({
      latitude: '35.1',
      longitude: '126.8',
      placeName: '광산구청',
    });

    const { getByTestId, queryByTestId } = render(<ReservationLocationPage />);

    expect(getByTestId('kakao-marker-webview')).toBeTruthy();
    expect(queryByTestId('apple-maps-view')).toBeNull();
    expect(lastKakaoProps).toEqual({
      center: { latitude: 35.1, longitude: 126.8 },
      title: '광산구청',
    });
  });

  it('장소명이 없으면 기본 제목을 쓰고 하단 장소명 영역을 숨긴다', () => {
    mockUseLocalSearchParams.mockReturnValue({ latitude: '35.1', longitude: '126.8' });

    const { getByText, queryAllByText } = render(<ReservationLocationPage />);

    expect(getByText('약속 장소')).toBeTruthy();
    expect(queryAllByText('약속 장소')).toHaveLength(1);
  });

  it('좌표가 숫자가 아니면 지도 대신 안내 문구를 보여준다', () => {
    mockUseLocalSearchParams.mockReturnValue({ latitude: 'abc', longitude: '126.8' });

    const { getByText, queryByTestId } = render(<ReservationLocationPage />);

    expect(getByText('위치 정보를 불러올 수 없습니다.')).toBeTruthy();
    expect(queryByTestId('apple-maps-view')).toBeNull();
    expect(queryByTestId('kakao-marker-webview')).toBeNull();
  });
});
