import { memo, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Coordinates } from 'expo-maps';

interface KakaoMapMarkerWebViewProps {
  readonly center: Required<Coordinates>;
  readonly title?: string;
}

const escapeForScript = (text: string) => text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const buildHtml = (appKey: string, center: Required<Coordinates>, title: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html,body,#map{width:100%;height:100%;margin:0;padding:0;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
<script>
  kakao.maps.load(function () {
    var position = new kakao.maps.LatLng(${center.latitude}, ${center.longitude});
    var map = new kakao.maps.Map(document.getElementById('map'), {
      center: position,
      level: 4,
    });
    // 마커를 지도 좌표에 직접 붙여야 지도를 움직여도 화면이 아니라 이 위치에 고정된다
    var marker = new kakao.maps.Marker({ position: position, map: map });
    ${
      title
        ? `
    var infowindow = new kakao.maps.InfoWindow({
      content: '<div style="padding:4px 8px;font-size:12px;white-space:nowrap;">${escapeForScript(title)}</div>',
    });
    infowindow.open(map, marker);
    `
        : ''
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
  });
</script>
</body>
</html>
`;

export const KakaoMapMarkerWebView = memo(({ center, title }: KakaoMapMarkerWebViewProps) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const appKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

  const source = useMemo(
    () =>
      appKey ? { html: buildHtml(appKey, center, title ?? ''), baseUrl: 'http://localhost' } : null,
    [appKey, center, title]
  );

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
        originWhitelist={['*']}
        source={source as { html: string; baseUrl: string }}
        onMessage={() => setIsMapReady(true)}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
      {isMapReady ? null : (
        <View className="absolute inset-0 items-center justify-center bg-white">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
});
