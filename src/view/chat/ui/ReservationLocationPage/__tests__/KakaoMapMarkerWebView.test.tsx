import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ActivityIndicator } from 'react-native';
import { render } from '@testing-library/react-native';
import { KakaoMapMarkerWebView } from '../KakaoMapMarkerWebView';

// EXPO_PUBLIC_KAKAO_JS_KEY is inlined at babel-transform time by
// react-native-dotenv from the repo's committed .env file (see the identical
// note in ReservationMapPage/__tests__/KakaoMapWebView.test.tsx).
const rootEnvPath = path.resolve(__dirname, '../../../../../../.env');
const parsedEnv = dotenv.parse(fs.readFileSync(rootEnvPath));
const KAKAO_JS_KEY = parsedEnv.EXPO_PUBLIC_KAKAO_JS_KEY;

let lastWebViewProps: any = null;

jest.mock('react-native-webview', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: any) => {
      lastWebViewProps = props;
      return ReactActual.createElement(View, { testID: 'kakao-webview' });
    },
  };
});

describe('KakaoMapMarkerWebView', () => {
  const center = { latitude: 35.1397, longitude: 126.7938 };

  beforeEach(() => {
    lastWebViewProps = null;
  });

  it('sanity check: .env defines a non-empty EXPO_PUBLIC_KAKAO_JS_KEY (precondition for the tests below)', () => {
    expect(KAKAO_JS_KEY).toBeTruthy();
  });

  it('카카오 JS 키가 있으면 appKey와 중심 좌표가 담긴 HTML source로 WebView를 렌더링한다', () => {
    const { getByTestId } = render(<KakaoMapMarkerWebView center={center} />);

    expect(getByTestId('kakao-webview')).toBeTruthy();
    expect(lastWebViewProps.source.html).toContain(KAKAO_JS_KEY);
    expect(lastWebViewProps.source.html).toContain(String(center.latitude));
    expect(lastWebViewProps.source.html).toContain(String(center.longitude));
    expect(lastWebViewProps.source.baseUrl).toBe('http://localhost');
  });

  it('한글 장소명이 깨지지 않도록 UTF-8 charset meta 태그를 포함한다', () => {
    render(<KakaoMapMarkerWebView center={center} title="상무역 2번 출구" />);

    expect(lastWebViewProps.source.html).toContain('<meta charset="utf-8" />');
  });

  it('title(장소명)을 인포윈도우 내용에 그대로 포함한다', () => {
    render(<KakaoMapMarkerWebView center={center} title="상무역 2번 출구" />);

    expect(lastWebViewProps.source.html).toContain('상무역 2번 출구');
  });

  it('title이 없으면 인포윈도우를 생성하지 않는다', () => {
    render(<KakaoMapMarkerWebView center={center} />);

    expect(lastWebViewProps.source.html).not.toContain('InfoWindow');
  });

  it('title에 작은따옴표가 있으면 스크립트가 깨지지 않도록 이스케이프한다', () => {
    render(<KakaoMapMarkerWebView center={center} title="It's here" />);

    expect(lastWebViewProps.source.html).toContain("It\\'s here");
  });

  it('메시지를 받기 전까지 로딩 스피너를 보여준다', () => {
    const { UNSAFE_getByType } = render(<KakaoMapMarkerWebView center={center} />);

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
