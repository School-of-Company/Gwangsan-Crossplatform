import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import type { CameraPosition, Coordinates } from 'expo-maps';
import * as Location from 'expo-location';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Button, Header } from '~/shared/ui';
import { getCurrentLocation } from '~/shared/lib/getCurrentLocation';
import { reverseGeocode } from '~/shared/lib/reverseGeocode';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import { ReservationPlaceNameSheet } from '~/view/chat/ui/ReservationPlaceNameSheet';

// 광산구청 좌표 — 지도의 기준(초기) 위치
const DEFAULT_CENTER = { latitude: 35.1397, longitude: 126.7938 };
const MARKER_COLOR = '#8FC31D';

interface SelectedCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

interface MapViewRef {
  setCameraPosition: (config?: CameraPosition) => void;
}

export function ReservationMapPage() {
  const router = useRouter();
  const {
    placeName: storedPlaceName,
    setCoordinates,
    setPlaceName,
  } = useReservationLocationStore();

  const mapRef = useRef<MapViewRef | null>(null);
  const assignMapRef = useCallback((instance: MapViewRef | null) => {
    mapRef.current = instance;
  }, []);
  const centerCoordinateRef = useRef<SelectedCoordinate | null>(null);

  const [cameraCenter, setCameraCenter] = useState<SelectedCoordinate | null>(null);
  const [address, setAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isPlaceNameSheetVisible, setIsPlaceNameSheetVisible] = useState(false);
  const [placeNameDraft, setPlaceNameDraft] = useState(storedPlaceName);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentLocation()
      .then((coordinate) => {
        if (isMounted) {
          setCameraCenter(coordinate);
          centerCoordinateRef.current = coordinate;
        }
      })
      .catch(() => {
        if (isMounted) {
          setCameraCenter(DEFAULT_CENTER);
          centerCoordinateRef.current = DEFAULT_CENTER;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCameraMove = useCallback((event: { coordinates: Coordinates }) => {
    const { latitude, longitude } = event.coordinates;
    if (latitude === undefined || longitude === undefined) return;
    centerCoordinateRef.current = { latitude, longitude };
  }, []);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    try {
      setIsSearching(true);
      const [result] = await Location.geocodeAsync(query);
      if (!result) {
        Toast.show({ type: 'error', text1: '검색 결과가 없습니다.' });
        return;
      }

      const coordinate = { latitude: result.latitude, longitude: result.longitude };
      centerCoordinateRef.current = coordinate;
      mapRef.current?.setCameraPosition({ coordinates: coordinate, zoom: 16 });
    } catch (error) {
      logger.error('geocodeAsync failed', error);
      Toast.show({ type: 'error', text1: '장소 검색에 실패했습니다.' });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleNext = useCallback(async () => {
    const coordinate = centerCoordinateRef.current;
    if (!coordinate) return;

    try {
      setIsResolvingAddress(true);
      const resolvedAddress = await reverseGeocode(coordinate);
      setAddress(resolvedAddress);
      setIsPlaceNameSheetVisible(true);
    } catch (error) {
      logger.error('reverseGeocode failed', error);
      setAddress('');
      setIsPlaceNameSheetVisible(true);
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  const handleConfirmPlaceName = useCallback(() => {
    const coordinate = centerCoordinateRef.current;
    if (!coordinate || !placeNameDraft.trim()) return;
    setCoordinates(coordinate.latitude, coordinate.longitude, address);
    setPlaceName(placeNameDraft.trim());
    router.back();
  }, [address, placeNameDraft, setCoordinates, setPlaceName, router]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="장소 선택" />

      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-gray-400 px-4 py-3">
          <Icon name="search-outline" size={18} color="#8F9094" />
          <TextInput
            className="flex-1 text-body5 text-gray-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="장소나 주소로 검색"
            returnKeyType="search"
            editable={!isSearching}
          />
          {isSearching ? <ActivityIndicator size="small" /> : null}
        </View>
      </View>

      <View className="flex-1">
        {cameraCenter ? (
          Platform.OS === 'ios' ? (
            <AppleMaps.View
              ref={assignMapRef}
              style={{ flex: 1 }}
              cameraPosition={{ coordinates: cameraCenter, zoom: 15 }}
              onCameraMove={handleCameraMove}
            />
          ) : (
            <GoogleMaps.View
              ref={assignMapRef}
              style={{ flex: 1 }}
              cameraPosition={{ coordinates: cameraCenter, zoom: 15 }}
              onCameraMove={handleCameraMove}
            />
          )
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}

        {cameraCenter ? (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Icon
              name="location"
              size={40}
              color={MARKER_COLOR}
              style={{ transform: [{ translateY: -20 }] }}
            />
          </View>
        ) : null}
      </View>

      <View className="gap-3 px-4 py-4">
        <Text className="text-body5 text-gray-500">
          지도를 움직여 거래 장소를 가운데에 맞춰주세요.
        </Text>
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={!cameraCenter || isResolvingAddress}
          width="w-full">
          <Text className="text-white">{isResolvingAddress ? '확인 중...' : '다음'}</Text>
        </Button>
      </View>

      <ReservationPlaceNameSheet
        isVisible={isPlaceNameSheetVisible}
        onClose={() => setIsPlaceNameSheetVisible(false)}
        address={address}
        placeName={placeNameDraft}
        onChangePlaceName={setPlaceNameDraft}
        onConfirm={handleConfirmPlaceName}
      />
    </SafeAreaView>
  );
}
