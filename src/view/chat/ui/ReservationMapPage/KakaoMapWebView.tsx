import { memo, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { Coordinates } from 'expo-maps';

interface KakaoMapWebViewProps {
  readonly center: Required<Coordinates>;
  readonly onCameraMove: (event: { coordinates: Coordinates }) => void;
}

const buildHtml = (appKey: string, center: Required<Coordinates>) => `
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
  const appKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

  // 마운트 시점의 좌표만 사용한다. 이후 center가 바뀌어도 source를 다시 만들지 않아야
  // WebView가 새로고침되지 않는다. 다른 위치로 옮기려면 이 컴포넌트를 새로 마운트해야 한다.
  const mountedCenterRef = useRef(center);
  const source = useMemo(
    () =>
      appKey
        ? { html: buildHtml(appKey, mountedCenterRef.current), baseUrl: 'http://localhost' }
        : null,
    [appKey]
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type !== 'cameraMove') return;
    setIsMapReady(true);
    onCameraMove({ coordinates: { latitude: data.latitude, longitude: data.longitude } });
  };

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
        onMessage={handleMessage}
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
