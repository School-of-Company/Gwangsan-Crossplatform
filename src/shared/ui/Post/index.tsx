import { Image, Text, View } from 'react-native';

export default function Post() {
  return (
    <View className="flex flex-row items-center gap-6 px-6 py-4">
      <Image
        className="size-20 rounded-lg"
        source={require('src/shared/assets/png/defaultProfile.png')}
      />
      <View className="flex gap-3">
        <Text className="text-body3">바퀴벌레 좀 잡아주세요</Text>
        <Text className="text-body5 text-gray-300">3000 광산</Text>
      </View>
    </View>
  );
}
