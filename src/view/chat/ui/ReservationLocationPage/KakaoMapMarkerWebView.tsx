import { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { Coordinates } from 'expo-maps';

interface KakaoMapMarkerWebViewProps {
  readonly center: Required<Coordinates>;
  readonly title?: string;
}

// WebView가 로드하는 로컬 문서(baseUrl)의 오리진. 이 오리진과 about:blank만 허용해,
// 지도 SDK나 InfoWindow 클릭 등으로 임의의 외부 페이지로 내비게이션되는 것을 막는다.
const WEBVIEW_ORIGIN = 'http://localhost';

// title(상대방이 입력한 예약 장소명)을 <script> 안 문자열 리터럴로 안전하게 삽입한다.
// JSON.stringify만으로는 "</script>" 같은 시퀀스가 HTML 파서에 의해 스크립트 태그를
// 조기 종료시킬 수 있으므로 <, >, & 를 유니코드 이스케이프로 추가 치환한다. 이 값은
// 아래에서 HTML로 파싱되지 않고 항상 textContent로만 쓰인다.
const toScriptSafeJsonString = (value: string) =>
  JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const buildHtml = (appKey: string, center: Required<Coordinates>, title: string) => `
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
    var infowindowContent = document.createElement('div');
    infowindowContent.style.padding = '4px 8px';
    infowindowContent.style.fontSize = '12px';
    infowindowContent.style.whiteSpace = 'nowrap';
    // textContent로만 대입하므로 title에 포함된 마크업(예: <img onerror=...>)이
    // HTML로 해석되지 않고 순수 텍스트로만 렌더링된다.
    infowindowContent.textContent = ${toScriptSafeJsonString(title)};
    var infowindow = new kakao.maps.InfoWindow({ content: infowindowContent });
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
      appKey ? { html: buildHtml(appKey, center, title ?? ''), baseUrl: WEBVIEW_ORIGIN } : null,
    [appKey, center, title]
  );

  // 지도 SDK가 로드하는 최초 로컬 문서(about:blank 경유) 외의 모든 내비게이션(예: InfoWindow
  // 안의 링크 클릭, 스크립트에 의한 임의 페이지 이동)을 차단한다.
  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation) =>
      request.url === 'about:blank' || request.url.startsWith(WEBVIEW_ORIGIN),
    []
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
        originWhitelist={[WEBVIEW_ORIGIN, 'about:blank']}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        source={source as { html: string; baseUrl: string }}
        onMessage={() => setIsMapReady(true)}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />
      {isMapReady ? null : (
        <View className="absolute inset-0 items-center justify-center bg-background">
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
});
