import { Place } from '~/shared/consts/place';
import { Dong } from '../consts/dong';

export interface ProfileType {
  memberId: number;
  nickname: string;
  placeName: Place;
  dongName: Dong;
  light: number;
  gwangsan: number;
  description: string;
  specialties: string[];
}
