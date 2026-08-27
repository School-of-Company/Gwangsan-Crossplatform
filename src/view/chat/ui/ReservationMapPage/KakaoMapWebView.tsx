import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { CameraPosition, Coordinates } from 'expo-maps';

interface KakaoMapWebViewProps {
  readonly initialCenter: Required<Coordinates>;
  readonly onCameraMove: (event: { coordinates: Coordinates }) => void;
}

export interface KakaoMapWebViewRef {
  setCameraPosition: (config?: CameraPosition) => void;
}

// Google/Apple 지도의 zoom(클수록 확대)을 카카오맵의 level(작을수록 확대)로 대략 환산한다.
const zoomToKakaoLevel = (zoom?: number) => {
  if (zoom === undefined) return 4;
  return Math.max(1, Math.min(14, Math.round(21 - zoom)));
};

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

    window.setCameraPosition = function (lat, lng, level) {
      map.setCenter(new kakao.maps.LatLng(lat, lng));
      map.setLevel(level);
    };
  });
</script>
</body>
</html>
`;

export const KakaoMapWebView = forwardRef<KakaoMapWebViewRef, KakaoMapWebViewProps>(
  ({ initialCenter, onCameraMove }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const appKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

    useImperativeHandle(ref, () => ({
      setCameraPosition: (config) => {
        const { latitude, longitude } = config?.coordinates ?? {};
        if (latitude === undefined || longitude === undefined) return;
        const level = zoomToKakaoLevel(config?.zoom);
        webViewRef.current?.injectJavaScript(
          `window.setCameraPosition(${latitude}, ${longitude}, ${level}); true;`
        );
      },
    }));

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
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: buildHtml(appKey, initialCenter), baseUrl: 'http://localhost' }}
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
  }
);
