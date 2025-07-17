import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { PostType } from '~/shared/types/postType';

export default function Post({ id, title, gwangsan, imageUrls = [] }: PostType) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (id < 0) {
      return;
    }
    router.push(`/post/${id}`);
  }, [router, id]);

  const firstImage = imageUrls?.[0]?.imageUrl;
  const additionalImagesCount = (imageUrls?.length ?? 0) - 1;
  const isTemporary = id < 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex flex-row items-center gap-6 px-6 py-4"
      activeOpacity={isTemporary ? 1 : 0.7}
      disabled={isTemporary}>
      <View className="relative">
        <Image
          source={firstImage ? { uri: firstImage } : require('~/shared/assets/png/logo.png')}
          className={`size-20 rounded-lg ${isTemporary ? 'opacity-70' : ''}`}
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
