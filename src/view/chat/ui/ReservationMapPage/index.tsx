import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppleMaps } from 'expo-maps';
import type { CameraPosition, Coordinates } from 'expo-maps';
import Icon from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Header } from '~/shared/ui';
import { getCurrentLocation } from '~/shared/lib/getCurrentLocation';
import { reverseGeocode } from '~/shared/lib/reverseGeocode';
import { searchPlaces, type KakaoPlace } from '~/shared/api/kakaoLocalSearch';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import { ReservationPlaceNameSheet } from '~/view/chat/ui/ReservationPlaceNameSheet';
import { KakaoMapWebView } from '~/view/chat/ui/ReservationMapPage/KakaoMapWebView';

const SEARCH_DEBOUNCE_MS = 300;

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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);

  const [cameraCenter, setCameraCenter] = useState<SelectedCoordinate | null>(null);
  const [address, setAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isPlaceNameSheetVisible, setIsPlaceNameSheetVisible] = useState(false);
  const [placeNameDraft, setPlaceNameDraft] = useState(storedPlaceName);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KakaoPlace[]>([]);
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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const handleCameraMove = useCallback((event: { coordinates: Coordinates }) => {
    const { latitude, longitude } = event.coordinates;
    if (latitude === undefined || longitude === undefined) return;
    centerCoordinateRef.current = { latitude, longitude };
  }, []);

  const handleChangeSearchQuery = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const query = text.trim();
    if (!query) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const requestId = (searchRequestIdRef.current += 1);
      setIsSearching(true);
      searchPlaces(query)
        .then((results) => {
          if (searchRequestIdRef.current === requestId) setSuggestions(results);
        })
        .catch((error) => {
          logger.error('searchPlaces failed', error);
          if (searchRequestIdRef.current === requestId) setSuggestions([]);
        })
        .finally(() => {
          if (searchRequestIdRef.current === requestId) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const handleSelectSuggestion = useCallback((place: KakaoPlace) => {
    const coordinate = { latitude: Number(place.y), longitude: Number(place.x) };
    centerCoordinateRef.current = coordinate;
    mapRef.current?.setCameraPosition({ coordinates: coordinate, zoom: 17 });
    setSearchQuery(place.place_name);
    setSuggestions([]);
    Keyboard.dismiss();
  }, []);

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
            onChangeText={handleChangeSearchQuery}
            placeholder="장소나 주소로 검색"
            returnKeyType="search"
          />
          {isSearching ? <ActivityIndicator size="small" /> : null}
        </View>

        {suggestions.length > 0 ? (
          <View className="mt-2 max-h-60 rounded-xl border border-gray-400">
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  className="border-b border-gray-100 px-4 py-3 last:border-b-0"
                  onPress={() => handleSelectSuggestion(place)}>
                  <Text className="text-body5 text-gray-900" numberOfLines={1}>
                    {place.place_name}
                  </Text>
                  <Text className="caption text-gray-500" numberOfLines={1}>
                    {place.road_address_name || place.address_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
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
            <KakaoMapWebView
              ref={assignMapRef}
              initialCenter={cameraCenter}
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
