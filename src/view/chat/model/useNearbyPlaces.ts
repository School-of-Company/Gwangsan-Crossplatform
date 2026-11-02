import { useCallback, useEffect, useRef, useState } from 'react';
import { getAddressName, searchNearbyPlaces, type KakaoPlace } from '~/shared/api/kakaoLocalSearch';
import { logger } from '~/shared/lib/logger';

// 드래그가 끝나고(마커를 놓고) 이 시간 동안 추가 이동이 없으면 그때 한 번만 조회한다.
export const NEARBY_DEBOUNCE_MS = 500;
export const NEARBY_RADIUS_METERS = 1000;
export const NEARBY_RESULT_COUNT = 3;

export interface SelectedCoordinate {
  readonly latitude: number;
  readonly longitude: number;
}

// 지도 중심(마커) 주변 장소와 그 위치의 주소. 늦게 도착한 이전 좌표의 결과는 버린다
export const useNearbyPlaces = () => {
  const nearbyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nearbyRequestIdRef = useRef(0);
  const lastFetchedCoordinateRef = useRef<SelectedCoordinate | null>(null);

  const [nearbyPlaces, setNearbyPlaces] = useState<KakaoPlace[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [hasLoadedNearbyOnce, setHasLoadedNearbyOnce] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    return () => {
      if (nearbyTimeoutRef.current) clearTimeout(nearbyTimeoutRef.current);
    };
  }, []);

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
      if (nearbyRequestIdRef.current === requestId) {
        setIsLoadingNearby(false);
        setHasLoadedNearbyOnce(true);
      }
    }
  }, []);

  const scheduleFetchNearbyPlaces = useCallback(
    (coordinate: SelectedCoordinate) => {
      if (nearbyTimeoutRef.current) clearTimeout(nearbyTimeoutRef.current);
      nearbyTimeoutRef.current = setTimeout(() => {
        fetchNearbyPlaces(coordinate);
      }, NEARBY_DEBOUNCE_MS);
    },
    [fetchNearbyPlaces]
  );

  const getLastFetchedCoordinate = useCallback(() => lastFetchedCoordinateRef.current, []);

  return {
    nearbyPlaces,
    isLoadingNearby,
    hasLoadedNearbyOnce,
    currentAddress,
    fetchNearbyPlaces,
    scheduleFetchNearbyPlaces,
    getLastFetchedCoordinate,
  };
};
