import { ImageType } from '~/shared/types/imageType';

export interface ReviewPostType {
  reviewerName: string;
  content: string;
  light: number;
  productId: number;
  images: ImageType[];
}
