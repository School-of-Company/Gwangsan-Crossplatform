import { ImageType } from '~/shared/types/imageType';

export interface ReviewPostType {
  producerId: number;
  content: string;
  light: number;
  reviewerName: string;
  imageUrls: ImageType[];
}
