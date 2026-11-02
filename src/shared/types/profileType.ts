import { HeadValue } from '~/shared/consts/place';
import { Dong } from '../consts/dong';

export interface ProfileType {
  memberId: number;
  nickname: string;
  placeName: string;
  // 서버 내 정보 응답에는 아직 없다. 내려오면 지점명보다 이 값으로 현재 지점을 찾는다.
  placeId?: number;
  headName: HeadValue;
  dongName: Dong;
  light: number;
  gwangsan: number;
  description: string;
  specialties: string[];
}
