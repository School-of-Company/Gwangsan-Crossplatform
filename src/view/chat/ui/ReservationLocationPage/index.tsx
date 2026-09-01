import { Platform, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppleMaps } from 'expo-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/shared/ui';
import { KakaoMapMarkerWebView } from '~/view/chat/ui/ReservationLocationPage/KakaoMapMarkerWebView';

const MARKER_COLOR = '#8FC31D';

export function ReservationLocationPage() {
  const { latitude, longitude, placeName } = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    placeName?: string;
  }>();

  const center = { latitude: Number(latitude), longitude: Number(longitude) };
  const isValidCoordinate = Number.isFinite(center.latitude) && Number.isFinite(center.longitude);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      <Header headerTitle={placeName || '약속 장소'} />

      <View className="flex-1">
        {isValidCoordinate ? (
          Platform.OS === 'ios' ? (
            <AppleMaps.View
              style={{ flex: 1 }}
              cameraPosition={{ coordinates: center, zoom: 16 }}
              markers={[{ coordinates: center, title: placeName, tintColor: MARKER_COLOR }]}
            />
          ) : (
            <KakaoMapMarkerWebView center={center} title={placeName} />
          )
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-body5 text-gray-500">
              위치 정보를 불러올 수 없습니다.
            </Text>
          </View>
        )}
      </View>

      {placeName ? (
        <View className="border-t border-gray-100 px-4 py-4">
          <Text className="text-body5 font-semibold text-gray-900">{placeName}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
