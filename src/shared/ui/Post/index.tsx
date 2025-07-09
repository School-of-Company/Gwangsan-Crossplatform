import { Image, Text, View } from 'react-native';
import { PostType } from '~/shared/types/postType';

export default function Post(data: PostType) {
  return (
    <View className="flex flex-row items-center gap-6 px-6 py-4">
      {data.imageUrls.length > 0 ? (
        data.imageUrls.map((image) => {
          return (
            <Image
              key={image.imageId}
              source={require(image.imageUrl)}
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
    </View>
  );
}
