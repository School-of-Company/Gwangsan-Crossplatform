import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ActivityIndicator } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { KakaoMapWebView } from '../KakaoMapWebView';

// NOTE on `process.env.EXPO_PUBLIC_KAKAO_JS_KEY`:
// `babel-plugin react-native-dotenv` (configured in babel.config.js) statically
// replaces any `process.env.<KEY>` member expression with a literal value parsed
// straight from the repo's committed `.env` file, at babel-transform time — see
// node_modules/react-native-dotenv/index.js's `MemberExpression` visitor. This
// happens once per test-process, independent of anything the test does to
// `process.env` at runtime (the exact same constraint documented in
// jest.setup.js for EXPO_PUBLIC_SENTRY_DSN, and independently reproducible via
// the currently-failing src/shared/api/__tests__/kakaoLocalSearch.test.ts, which
// attempts the identical env-toggle pattern for EXPO_PUBLIC_KAKAO_REST_API_KEY).
// Because `.env` in this repo defines a real, non-empty EXPO_PUBLIC_KAKAO_JS_KEY,
// `appKey` in KakaoMapWebView.tsx is always a truthy compile-time constant here,
// so the `!appKey` fallback branch can never execute in this test run — it is
// intentionally left uncovered (see final report).
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

describe('KakaoMapWebView', () => {
  const center = { latitude: 35.1397, longitude: 126.7938 };

  beforeEach(() => {
    lastWebViewProps = null;
  });

  it('sanity check: .env defines a non-empty EXPO_PUBLIC_KAKAO_JS_KEY (precondition for the tests below)', () => {
    expect(KAKAO_JS_KEY).toBeTruthy();
  });

  it('카카오 JS 키가 있으면 appKey와 초기 중심 좌표가 담긴 HTML source로 WebView를 렌더링한다', () => {
    const { getByTestId } = render(<KakaoMapWebView center={center} onCameraMove={jest.fn()} />);

    expect(getByTestId('kakao-webview')).toBeTruthy();
    expect(lastWebViewProps.source.html).toContain(KAKAO_JS_KEY);
    expect(lastWebViewProps.source.html).toContain(String(center.latitude));
    expect(lastWebViewProps.source.html).toContain(String(center.longitude));
    expect(lastWebViewProps.source.baseUrl).toBe('http://localhost');
  });

  it('cameraMove 메시지를 받기 전까지 로딩 스피너를 보여준다', () => {
    const { UNSAFE_getByType } = render(
      <KakaoMapWebView center={center} onCameraMove={jest.fn()} />
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('cameraMove 메시지를 받으면 onCameraMove를 호출하고 스피너를 숨긴다', () => {
    const onCameraMove = jest.fn();

    const { UNSAFE_queryByType } = render(
      <KakaoMapWebView center={center} onCameraMove={onCameraMove} />
    );

    act(() => {
      lastWebViewProps.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'cameraMove', latitude: 35.2, longitude: 126.9 }),
        },
      });
    });

    expect(onCameraMove).toHaveBeenCalledWith({
      coordinates: { latitude: 35.2, longitude: 126.9 },
    });
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it('다른 type의 메시지는 무시하고 onCameraMove를 호출하지 않으며 스피너를 유지한다', () => {
    const onCameraMove = jest.fn();

    const { UNSAFE_queryByType } = render(
      <KakaoMapWebView center={center} onCameraMove={onCameraMove} />
    );

    act(() => {
      lastWebViewProps.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'someOtherEvent', latitude: 35.2, longitude: 126.9 }),
        },
      });
    });

    expect(onCameraMove).not.toHaveBeenCalled();
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  it('마운트 이후 center prop이 바뀌어도 WebView의 source는 마운트 시점 좌표를 유지한다', () => {
    const { rerender } = render(<KakaoMapWebView center={center} onCameraMove={jest.fn()} />);

    const originalHtml = lastWebViewProps.source.html;
    expect(originalHtml).toContain(String(center.latitude));

    const newCenter = { latitude: 37.5665, longitude: 126.978 };
    rerender(<KakaoMapWebView center={newCenter} onCameraMove={jest.fn()} />);

    expect(lastWebViewProps.source.html).toBe(originalHtml);
    expect(lastWebViewProps.source.html).toContain(String(center.latitude));
    expect(lastWebViewProps.source.html).not.toContain(String(newCenter.latitude));
  });
});
