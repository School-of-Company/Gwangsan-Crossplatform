import type { PostType } from '~/shared/types/postType';

export const getPostThumbnail = ({ imageUrls, images }: Pick<PostType, 'imageUrls' | 'images'>) =>
  imageUrls?.[0]?.imageUrl ?? images?.[0]?.imageUrl ?? null;
