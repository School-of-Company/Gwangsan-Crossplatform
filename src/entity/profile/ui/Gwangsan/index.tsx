import { Image, Text, View } from 'react-native';

interface GwangsanProps {
  gwangsan?: number;
}

export default function Gwangsan({ gwangsan }: GwangsanProps) {
  return (
    <View className="flex gap-6 px-6">
      <Text className="text-titleSmall">광산</Text>
      <View className="flex flex-row items-center gap-4 rounded-2xl bg-gray-200 px-11 py-6">
        <Image
          className="shrink-0"
          source={require('~/shared/assets/png/Gwangsan.png')}
          width={60}
          height={60}
          resizeMode="contain"
        />
        <Text
          className="flex-1 shrink font-cafe24 text-titleMedium text-sub2-700"
          numberOfLines={2}>
          {gwangsan} 광산
        </Text>
      </View>
    </View>
  );
}
