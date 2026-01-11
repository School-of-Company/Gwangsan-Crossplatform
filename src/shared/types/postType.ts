import { ImageType } from './imageType';
import { ModeType } from './mode';
import { ProductType } from './type';

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
  images?: ImageType[];
}
