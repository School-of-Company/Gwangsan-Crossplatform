import { Image, Text, View } from 'react-native';

interface GwangsanBannerProps {
  gwangsan?: number;
}

export default function GwangsanBanner({ gwangsan }: GwangsanBannerProps) {
  return (
    <View className="flex flex-row items-center gap-3 bg-white px-6 py-5">
      <Image
        source={require('~/shared/assets/png/Gwangsan.png')}
        style={{ width: 48, height: 44 }}
        resizeMode="contain"
      />
      <View className="flex gap-1">
        <Text className="text-body1">광산</Text>
        <Text className="font-cafe24 text-titleMedium text-sub2-700">{gwangsan ?? 0}</Text>
      </View>
    </View>
  );
}
