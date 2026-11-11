import { CachedImage } from '~/shared/ui/CachedImage';
import { getPostThumbnail } from '~/shared/lib/getPostThumbnail';
import type { PostType } from '~/shared/types/postType';

export function PostThumbnail({
  post,
  className = '',
}: {
  post: Pick<PostType, 'imageUrls' | 'images'>;
  className?: string;
}) {
  const uri = getPostThumbnail(post);
  return (
    <CachedImage
      source={uri ? { uri } : require('~/shared/assets/png/icon.png')}
      className={`size-20 rounded-xl ${className}`}
      recyclingKey={uri ?? 'placeholder'}
      transition={200}
    />
  );
}
