import { ImageType } from './imageType';
import { ModeType } from './mode';
import { ProductType } from './type';

export interface TradeCounterpart {
  memberId: number;
  nickname: string;
}

export interface PostMember {
  memberId: number;
  nickname: string;
  placeName: string;
  light: number;
}

export interface PostType {
  id: number;
  type: ProductType;
  mode: ModeType;
  title: string;
  content: string;
  gwangsan: number;
  imageUrls?: ImageType[];
  isCompletable: boolean;
  isCompleted: boolean;
  isReserved: boolean;
  images?: ImageType[];
  seller?: TradeCounterpart;
  buyer?: TradeCounterpart;
  member?: PostMember;
}
