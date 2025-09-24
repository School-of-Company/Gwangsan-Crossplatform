import { ImageType } from './imageType';

export type TYPE = 'OBJECT' | 'SERVICE';

export type MODE = 'GIVER' | 'RECEIVER';

export interface PostType {
  id: number;
  type: TYPE;
  mode: MODE;
  title: string;
  content: string;
  gwangsan: number;
  imageUrls?: ImageType[];
  isCompletable: boolean;
  isCompleted: boolean;
  images?: ImageType[];
}
