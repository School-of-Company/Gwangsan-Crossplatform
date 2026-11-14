import { useRouter } from 'expo-router';
import { memo, useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PostThumbnail } from '~/shared/ui/PostThumbnail';
import { PostType } from '~/shared/types/postType';
import { acquireNavigationLock } from '~/shared/lib/navigationGuard';

interface PostProps extends PostType {
  paddingClassName?: string;
}

function Post({
  id,
  title,
  gwangsan,
  isReserved,
  imageUrls = [],
  images = [],
  seller,
  buyer,
  paddingClassName = 'px-6 py-4',
}: PostProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (id < 0 || !acquireNavigationLock()) {
      return;
    }
    router.push(`/post/${id}`);
  }, [router, id]);

  const additionalImagesCount =
    (imageUrls?.length && imageUrls.length > 0
      ? imageUrls.length
      : Array.isArray(images)
        ? images.length
        : 0) - 1;
  const isTemporary = id < 0;
  const accessibilityLabel = [
    title,
    `${gwangsan} 광산`,
    isTemporary && '업로드 중',
    isReserved && '예약중',
    seller && `판매자 ${seller.nickname}`,
    buyer && `구매자 ${buyer.nickname}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`flex flex-row items-center gap-6 ${paddingClassName}`}
      activeOpacity={isTemporary ? 1 : 0.7}
      disabled={isTemporary}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <View className="relative">
        <PostThumbnail post={{ imageUrls, images }} className={isTemporary ? 'opacity-70' : ''} />
        {additionalImagesCount > 0 && (
          <View className="absolute bottom-1 right-1 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-xs text-white">+{additionalImagesCount}</Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          {/* 목록(VirtualList)이 카드 높이를 고정값으로 배치하므로 긴 제목이 줄바꿈돼 카드가 커지지 않게 한다 */}
          <Text
            numberOfLines={1}
            className={`shrink text-lg font-semibold text-foreground ${isTemporary ? 'opacity-70' : ''}`}>
            {title}
          </Text>
          {isReserved && (
            <Text testID="post-reserved-tag" className="text-xs text-gray-500">
              예약중
            </Text>
          )}
        </View>
        <Text className={`text-sm text-gray-600 ${isTemporary ? 'opacity-70' : ''}`}>
          {gwangsan} 광산
        </Text>
        {seller && (
          <Text testID="post-seller" numberOfLines={1} className="text-xs text-gray-500">
            판매자: {seller.nickname}
          </Text>
        )}
        {buyer && (
          <Text testID="post-buyer" numberOfLines={1} className="text-xs text-gray-500">
            구매자: {buyer.nickname}
          </Text>
        )}
        {isTemporary && <Text className="mt-1 text-xs text-gray-400">업로드 중...</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default memo(Post);
