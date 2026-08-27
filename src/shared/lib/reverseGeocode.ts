import * as Location from 'expo-location';
import type { Coordinates } from './getCurrentLocation';

export const reverseGeocode = async ({ latitude, longitude }: Coordinates): Promise<string> => {
  const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
  if (!result) return '';

  return [result.region, result.city, result.district, result.street, result.name]
    .filter((part): part is string => Boolean(part))
    .join(' ');
};
