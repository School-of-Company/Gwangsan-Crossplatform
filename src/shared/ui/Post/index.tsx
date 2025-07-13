import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { PostType } from '~/shared/types/postType';

export default function Post({ id, title, gwangsan, imageUrls = [] }: PostType) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push(`/post/${id}`);
  }, [router, id]);

  const firstImage = imageUrls?.[0]?.imageUrl;
  const additionalImagesCount = (imageUrls?.length ?? 0) - 1;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex flex-row items-center gap-6 px-6 py-4"
      activeOpacity={0.7}>
      <View className="relative">
        <Image
          source={
            firstImage && firstImage.startsWith('http')
              ? { uri: firstImage }
              : imageUrls?.[0]?.imageUrl
                ? { uri: imageUrls[0].imageUrl }
                : require('~/shared/assets/png/logo.png')
          }
          className="size-20 rounded-lg"
        />
        {additionalImagesCount > 0 && (
          <View className="absolute bottom-1 right-1 rounded-md bg-black/50 px-2 py-1">
            <Text className="text-xs text-white">+{additionalImagesCount}</Text>
          </View>
        )}
      </View>
      <View className="flex flex-1 gap-3">
        <Text className="text-body3" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Text className="text-body5 text-gray-300">{gwangsan}광산</Text>
      </View>
    </TouchableOpacity>
  );
}
