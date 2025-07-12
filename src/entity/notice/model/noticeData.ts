import { ImageType } from '~/shared/types/imageType';

export interface NoticeData {
  id: number;
  title: string;
  content: string;
  place: string;
  createdAt: string;
  role: string;
  images: ImageType[];
}

export interface NoticeListData {
  id: number;
  title: string;
  content: string;
  images: ImageType[];
}