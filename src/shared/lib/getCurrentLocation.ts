import * as Location from 'expo-location';

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

const LOCATION_TIMEOUT_MS = 8000;

export const getCurrentLocation = async (): Promise<Coordinates> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('위치 권한이 필요합니다.');
  }

  let timeoutId: ReturnType<typeof setTimeout>;
  const position = await Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('위치 확인이 지연되고 있습니다.')),
        LOCATION_TIMEOUT_MS
      );
    }),
  ]).finally(() => clearTimeout(timeoutId));

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
};
