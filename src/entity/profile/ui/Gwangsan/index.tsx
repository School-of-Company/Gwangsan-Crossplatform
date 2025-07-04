import { Image, Text, View } from 'react-native';

export default function Gwangsan() {
  return (
    <View className="flex gap-6 px-6">
      <Text className="text-titleSmall">광산</Text>
      <View className="flex flex-row items-center justify-around rounded-2xl bg-gray-200 px-11 py-6">
        <Image
          source={require('~/shared/assets/png/Gwangsan.png')}
          width={57}
          height={52}
          resizeMode="contain"
        />
        <Text className="font-cafe24 text-titleMedium text-sub2-700">5000 광산</Text>
      </View>
    </View>
  );
}
