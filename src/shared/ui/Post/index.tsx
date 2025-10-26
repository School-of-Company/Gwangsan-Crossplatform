import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { PostType } from '~/shared/types/postType';

export default function Post({ id, title, gwangsan, imageUrls = [], images = [] }: PostType) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (id < 0) {
      return;
    }
    router.push(`/post/${id}`);
  }, [router, id]);

  const firstImage =
    imageUrls?.[0]?.imageUrl ??
    (Array.isArray(images) && images.length > 0
      ? typeof images[0] === 'string'
        ? images[0]
        : (images[0]?.imageUrl ?? images[0]?.imageUrl ?? images[0]?.imageUrl)
      : null);
  const additionalImagesCount =
    (imageUrls?.length && imageUrls.length > 0
      ? imageUrls.length
      : Array.isArray(images)
        ? images.length
        : 0) - 1;
  const isTemporary = id < 0;

  useEffect(() => {
    if (firstImage) {
      ExpoImage.prefetch(firstImage);
    }
  }, [firstImage]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex flex-row items-center gap-6 px-6 py-4"
      activeOpacity={isTemporary ? 1 : 0.7}
      disabled={isTemporary}>
      <View className="relative">
        <ExpoImage
          source={firstImage ? { uri: firstImage } : require('~/shared/assets/png/icon.png')}
          className={`size-20 rounded-lg ${isTemporary ? 'opacity-70' : ''}`}
          style={{ width: 80, height: 80, borderRadius: 12 }}
          cachePolicy="memory"
          contentFit="cover"
          recyclingKey={firstImage ?? 'placeholder'}
          transition={200}
        />
        {additionalImagesCount > 0 && (
          <View className="absolute bottom-1 right-1 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-xs text-white">+{additionalImagesCount}</Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${isTemporary ? 'opacity-70' : ''}`}>{title}</Text>
        <Text className={`text-sm text-gray-600 ${isTemporary ? 'opacity-70' : ''}`}>
          {gwangsan} 광산
        </Text>
        {isTemporary && <Text className="mt-1 text-xs text-gray-400">업로드 중...</Text>}
      </View>
    </TouchableOpacity>
  );
}
