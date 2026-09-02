import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Coordinates } from 'expo-maps';
import Icon from '@expo/vector-icons/Ionicons';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '~/shared/ui';
import { getCurrentLocation } from '~/shared/lib/getCurrentLocation';
import {
  getAddressName,
  searchNearbyPlaces,
  searchPlaces,
  type KakaoPlace,
} from '~/shared/api/kakaoLocalSearch';
import { useReservationLocationStore } from '~/shared/store/useReservationLocationStore';
import { logger } from '~/shared/lib/logger';
import { KakaoMapWebView } from '~/view/chat/ui/ReservationMapPage/KakaoMapWebView';
import { ReservationPlaceNameSheet } from '~/view/chat/ui/ReservationPlaceNameSheet';

const SEARCH_DEBOUNCE_MS = 300;
// 드래그가 끝나고(마커를 놓고) 이 시간 동안 추가 이동이 없으면 그때 한 번만 조회한다.
const NEARBY_DEBOUNCE_MS = 500;
const NEARBY_RADIUS_METERS = 1000;
const NEARBY_RESULT_COUNT = 3;

// 광산구청 좌표 — 지도의 기준(초기) 위치
const DEFAULT_CENTER = { latitude: 35.1397, longitude: 126.7938 };
const MARKER_COLOR = '#8FC31D';

interface SelectedCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

// "교통,수송 > 지하철,전철 > 광주1호선" 같은 카테고리 경로에서 가장 구체적인 마지막 항목만 보여준다.
const getCategoryLabel = (categoryName: string): string => {
  const segments = categoryName.split('>');
  return segments[segments.length - 1]?.trim() ?? '';
};

const formatDistanceLabel = (distance?: string): string => {
  if (!distance) return '';
  const meters = Number(distance);
  if (!Number.isFinite(meters)) return '';
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;
};

function NearbyPlacesSkeleton() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // 무한 반복 애니메이션이라 언마운트 시 명시적으로 취소하지 않으면, 이미 해제된
    // 뷰에 뒤늦게 prop을 반영하려다 reanimated가 크래시할 수 있다.
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={pulseStyle}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className={`gap-2 px-4 py-3 ${index < 2 ? 'border-b border-gray-100' : ''}`}>
          <View className="h-4 w-2/5 rounded bg-gray-200" />
          <View className="h-3 w-3/5 rounded bg-gray-100" />
        </View>
      ))}
    </Animated.View>
  );
}

export function ReservationMapPage() {
  const router = useRouter();
  const { setCoordinates, setPlaceName } = useReservationLocationStore();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestIdRef = useRef(0);
  const nearbyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearbyRequestIdRef = useRef(0);
  const lastFetchedCoordinateRef = useRef<SelectedCoordinate | null>(null);

  const [cameraCenter, setCameraCenter] = useState<SelectedCoordinate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<KakaoPlace[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [isPlaceNameSheetVisible, setIsPlaceNameSheetVisible] = useState(false);
  const [placeNameDraft, setPlaceNameDraft] = useState('');

  const isSearchActive = searchQuery.trim().length > 0;

  // cameraCenter는 값이 바뀌지 않아도 매 렌더링마다 새 객체를 만들면
  // expo-maps가 카메라를 계속 리셋해서 지도가 새로고침되는 것처럼 보인다.
  const initialCameraPosition = useMemo(
    () => (cameraCenter ? { coordinates: cameraCenter, zoom: 15 } : null),
    [cameraCenter]
  );

  const fetchNearbyPlaces = useCallback(async (coordinate: SelectedCoordinate) => {
    const last = lastFetchedCoordinateRef.current;
    // 마커 위치가 실제로 바뀌지 않았다면(같은 좌표로 중복 호출) 다시 조회하지 않는다.
    if (last && last.latitude === coordinate.latitude && last.longitude === coordinate.longitude) {
      return;
    }
    lastFetchedCoordinateRef.current = coordinate;

    const requestId = (nearbyRequestIdRef.current += 1);
    setIsLoadingNearby(true);

    try {
      const [places, addressNameFromApi] = await Promise.all([
        searchNearbyPlaces(coordinate, NEARBY_RADIUS_METERS),
        getAddressName(coordinate).catch((error) => {
          logger.error('getAddressName failed', error);
          return '';
        }),
      ]);
      // coord2address가 비어서 오면(간헐적 실패 등) 근처 장소 중 가장 가까운 곳의 주소로 대체한다.
      const addressName =
        addressNameFromApi || places[0]?.road_address_name || places[0]?.address_name || '';
      if (nearbyRequestIdRef.current === requestId) {
        setNearbyPlaces(places.slice(0, NEARBY_RESULT_COUNT));
        setCurrentAddress(addressName);
      }
    } catch (error) {
      logger.error('fetchNearbyPlaces failed', error);
      if (nearbyRequestIdRef.current === requestId) {
        setNearbyPlaces([]);
        setCurrentAddress('');
      }
    } finally {
      if (nearbyRequestIdRef.current === requestId) setIsLoadingNearby(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getCurrentLocation()
      .then((coordinate) => {
        if (isMounted) {
          setCameraCenter(coordinate);
          fetchNearbyPlaces(coordinate);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCameraCenter(DEFAULT_CENTER);
          fetchNearbyPlaces(DEFAULT_CENTER);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchNearbyPlaces]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (nearbyTimeoutRef.current) clearTimeout(nearbyTimeoutRef.current);
    };
  }, []);

  const handleCameraMove = useCallback(
    (event: { coordinates: Coordinates }) => {
      const { latitude, longitude } = event.coordinates;
      if (latitude === undefined || longitude === undefined) return;
      const coordinate = { latitude, longitude };

      if (nearbyTimeoutRef.current) clearTimeout(nearbyTimeoutRef.current);
      nearbyTimeoutRef.current = setTimeout(() => {
        fetchNearbyPlaces(coordinate);
      }, NEARBY_DEBOUNCE_MS);
    },
    [fetchNearbyPlaces]
  );

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

  const handleSelectSearchSuggestion = useCallback(
    (place: KakaoPlace) => {
      const coordinate = { latitude: Number(place.y), longitude: Number(place.x) };
      setCameraCenter(coordinate);
      setSearchQuery('');
      setSuggestions([]);
      Keyboard.dismiss();
      fetchNearbyPlaces(coordinate);
    },
    [fetchNearbyPlaces]
  );

  const handleSelectNearbyPlace = useCallback(
    (place: KakaoPlace) => {
      const coordinate = { latitude: Number(place.y), longitude: Number(place.x) };
      setCoordinates(
        coordinate.latitude,
        coordinate.longitude,
        place.road_address_name || place.address_name
      );
      setPlaceName(place.place_name);
      router.back();
    },
    [router, setCoordinates, setPlaceName]
  );

  const handleOpenPlaceNameSheet = useCallback(() => {
    setPlaceNameDraft('');
    setIsPlaceNameSheetVisible(true);
  }, []);

  const handleConfirmPlaceName = useCallback(() => {
    const coordinate = lastFetchedCoordinateRef.current;
    if (!coordinate || !placeNameDraft.trim()) return;
    setCoordinates(coordinate.latitude, coordinate.longitude, currentAddress);
    setPlaceName(placeNameDraft.trim());
    setIsPlaceNameSheetVisible(false);
    router.back();
  }, [currentAddress, placeNameDraft, router, setCoordinates, setPlaceName]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <Header headerTitle="장소 선택" />

      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl bg-gray-100 px-4 py-3">
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
      </View>

      <View className="flex-1">
        {isSearchActive ? (
          <View className="flex-1 bg-white">
            {suggestions.length > 0 ? (
              <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                {suggestions.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    className="border-b border-gray-100 px-4 py-3"
                    onPress={() => handleSelectSearchSuggestion(place)}>
                    <Text className="text-body5 text-gray-900" numberOfLines={1}>
                      {place.place_name}
                    </Text>
                    <Text className="caption text-gray-500" numberOfLines={1}>
                      {place.road_address_name || place.address_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View className="flex-1 items-center justify-center px-4">
                <Text className="text-body5 text-gray-400">
                  {isSearching ? '검색 중...' : '검색 결과가 없어요.'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1">
            {cameraCenter ? (
              Platform.OS === 'ios' ? (
                <AppleMaps.View
                  style={{ flex: 1 }}
                  cameraPosition={initialCameraPosition ?? undefined}
                  onCameraMove={handleCameraMove}
                />
              ) : (
                <KakaoMapWebView center={cameraCenter} onCameraMove={handleCameraMove} />
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
        )}
      </View>

      {isSearchActive ? null : (
        <View className="px-4 pb-4 pt-2">
          <View className="rounded-xl">
            <TouchableOpacity
              className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3"
              disabled={!currentAddress}
              onPress={handleOpenPlaceNameSheet}>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Icon name="add" size={20} color={MARKER_COLOR} />
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-body5 font-semibold text-gray-900" numberOfLines={1}>
                  이 주소에 대한 장소명 입력하기
                </Text>
                <Text className="caption text-gray-500" numberOfLines={2}>
                  {isLoadingNearby
                    ? '주소를 확인하는 중...'
                    : currentAddress || '주소를 찾을 수 없어요.'}
                </Text>
              </View>
              <View className="rounded-full bg-gray-200 px-4 py-2">
                <Text className="label text-gray-700">입력</Text>
              </View>
            </TouchableOpacity>

            {isLoadingNearby ? (
              <NearbyPlacesSkeleton />
            ) : nearbyPlaces.length > 0 ? (
              nearbyPlaces.map((place, index) => (
                <TouchableOpacity
                  key={place.id}
                  className={`flex-row items-center gap-3 px-4 py-3 ${
                    index < nearbyPlaces.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  onPress={() => handleSelectNearbyPlace(place)}>
                  <View className="h-10 w-10 items-center justify-center">
                    <Icon name="location" size={28} color={MARKER_COLOR} />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-body5 font-semibold text-gray-900" numberOfLines={1}>
                        {place.place_name}
                      </Text>
                      <Text className="caption text-gray-400" numberOfLines={1}>
                        {[
                          getCategoryLabel(place.category_name),
                          formatDistanceLabel(place.distance),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                    <Text className="caption text-gray-500" numberOfLines={1}>
                      {place.road_address_name || place.address_name}
                    </Text>
                  </View>
                  <View className="rounded-full bg-gray-200 px-4 py-2">
                    <Text className="label text-gray-700">선택</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="caption px-4 py-3 text-gray-400">주변 장소를 찾을 수 없어요.</Text>
            )}
          </View>
        </View>
      )}

      <ReservationPlaceNameSheet
        isVisible={isPlaceNameSheetVisible}
        onClose={() => setIsPlaceNameSheetVisible(false)}
        address={currentAddress}
        placeName={placeNameDraft}
        onChangePlaceName={setPlaceNameDraft}
        onConfirm={handleConfirmPlaceName}
      />
    </SafeAreaView>
  );
}
