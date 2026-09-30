import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import {
  WebView,
  type WebViewNavigation,
  type WebViewMessageEvent,
} from 'react-native-webview';
import type { Coordinates } from 'expo-maps';
import { z } from 'zod';
import { logger } from '~/shared/lib/logger';

interface KakaoMapWebViewProps {
  readonly center: Required<Coordinates>;
  readonly onCameraMove: (event: { coordinates: Coordinates }) => void;
}

const MAP_LOAD_TIMEOUT_MS = 10000;

// WebView가 로드하는 로컬 문서(baseUrl)의 오리진. 이 오리진과 about:blank만 허용해
// 임의의 외부 페이지로 내비게이션되는 것을 막는다.
const WEBVIEW_ORIGIN = 'http://localhost';

// WebView 내부 스크립트가 postMessage로 보내는 메시지는 신뢰할 수 없는 입력이다.
// type 태그와 위도/경도 범위를 검증해, 형식이 어긋나거나 조작된 페이로드가
// 그대로 좌표로 쓰이지 않게 한다.
const cameraMoveMessageSchema = z.object({
  type: z.literal('cameraMove'),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

const buildHtml = (appKey: string, center: Required<Coordinates>) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html,body,#map{width:100%;height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
<script>
  kakao.maps.load(function () {
    var map = new kakao.maps.Map(document.getElementById('map'), {
      center: new kakao.maps.LatLng(${center.latitude}, ${center.longitude}),
      level: 4,
    });

    function postCenter() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'cameraMove', latitude: c.getLat(), longitude: c.getLng() })
      );
    }

    kakao.maps.event.addListener(map, 'center_changed', postCenter);
    postCenter();
  });
</script>
</body>
</html>
`;

export const KakaoMapWebView = memo(({ center, onCameraMove }: KakaoMapWebViewProps) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

  // 마운트 시점의 좌표만 사용한다. 이후 center가 바뀌어도 source를 다시 만들지 않아야
  // WebView가 새로고침되지 않는다. 다른 위치로 옮기려면 이 컴포넌트를 새로 마운트해야 한다.
  // 재시도 시에는 그 시점의 최신 좌표로 다시 로드한다.
  const mountedCenterRef = useRef(center);
  const source = useMemo(() => {
    mountedCenterRef.current = center;
    return appKey
      ? { html: buildHtml(appKey, mountedCenterRef.current), baseUrl: WEBVIEW_ORIGIN }
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey, retryKey]);

  // SDK 스크립트 로딩이 느리거나 실패해 cameraMove 메시지가 영영 오지 않는 경우를 대비해,
  // 일정 시간 안에 지도가 뜨지 않으면 무한 스피너 대신 재시도 UI를 보여준다.
  useEffect(() => {
    if (isMapReady) return undefined;

    setHasLoadError(false);
    const timeoutId = setTimeout(() => setHasLoadError(true), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [retryKey, isMapReady]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch (error) {
        logger.warn('KakaoMapWebView: failed to parse WebView message', error);
        return;
      }

      const result = cameraMoveMessageSchema.safeParse(parsed);
      if (!result.success) return;

      const { latitude, longitude } = result.data;
      setIsMapReady(true);
      onCameraMove({ coordinates: { latitude, longitude } });
    },
    [onCameraMove]
  );

  // 지도 SDK가 로드하는 최초 로컬 문서(about:blank 경유) 외의 모든 내비게이션(예: 스크립트에
  // 의한 임의 페이지 이동)을 차단한다.
  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation) =>
      request.url === 'about:blank' || request.url.startsWith(WEBVIEW_ORIGIN),
    []
  );

  const handleLoadError = useCallback(() => setHasLoadError(true), []);

  const handleRetry = useCallback(() => {
    setIsMapReady(false);
    setHasLoadError(false);
    setRetryKey((prev) => prev + 1);
  }, []);

  if (!appKey) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 px-8">
        <Text className="text-center text-body5 text-gray-500">
          지도를 표시할 수 없습니다. 카카오 JavaScript 키가 설정되지 않았습니다.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <WebView
        key={retryKey}
        originWhitelist={[WEBVIEW_ORIGIN, 'about:blank']}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        source={source as { html: string; baseUrl: string }}
        onMessage={handleMessage}
        onError={handleLoadError}
        onHttpError={handleLoadError}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
      {hasLoadError ? (
        <View className="absolute inset-0 items-center justify-center bg-background px-8">
          <Text className="text-center text-body5 text-gray-500">
            지도를 불러오지 못했습니다. 네트워크 상태를 확인해주세요.
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            className="mt-4 rounded-full bg-gray-200 px-6 py-2">
            <Text className="label text-gray-700">다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : isMapReady ? null : (
        <View className="absolute inset-0 items-center justify-center bg-background">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
});
