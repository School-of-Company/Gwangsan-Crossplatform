import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { PostType } from '~/shared/types/postType';

export default function Post(data: PostType) {
  const router = useRouter();
  const handlePress = useCallback(() => {
    router.push('/post/' + data.id);
  }, [router]);
  return (
    <TouchableOpacity onPress={handlePress} className="flex flex-row items-center gap-6 px-6 py-4">
      {data.imageUrls.length > 0 ? (
        data.imageUrls.map((image) => {
          return (
            <Image
              key={image.imageId}
              source={
                image.imageUrl.startsWith('http') 
                  ? { uri: image.imageUrl }
                  : require('~/shared/assets/png/defaultProfile.png')
              }
              className="size-20 rounded-lg"
            />
          );
        })
      ) : (
        <Image
          source={require('~/shared/assets/png/defaultProfile.png')}
          className="size-20 rounded-lg"
        />
      )}
      <View className="flex gap-3">
        <Text className="text-body3">{data.title}</Text>
        <Text className="text-body5 text-gray-300">{data.gwangsan}광산</Text>
      </View>
    </TouchableOpacity>
  );
}
