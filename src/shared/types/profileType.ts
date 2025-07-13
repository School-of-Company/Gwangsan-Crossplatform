import { Place } from '~/shared/consts/place';

export interface ProfileType {
  memberId: number;
  nickname: string;
  placeName: Place;
  light: number;
  gwangsan: number;
  description: string;
  specialties: string[];
}
