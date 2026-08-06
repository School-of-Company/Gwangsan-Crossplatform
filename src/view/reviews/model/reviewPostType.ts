import { ImageType } from '~/shared/types/imageType';

export interface ReviewPostType {
  reviewerName: string;
  content: string;
  light: number;
  productId: number;
  // 명세는 imageUrls. 구버전 서버가 images로 주는 경우를 대비해 둘 다 optional
  imageUrls?: ImageType[];
  images?: ImageType[];
  reviewId: string;
}
