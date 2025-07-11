import { Text, View } from 'react-native';

interface LightProps {
  lightLevel?: number;
}

export default function Light({ lightLevel = 1 }: LightProps) {
  return (
    <View className="mb- px-6 py-10">
      <Text className="mb-6 text-titleSmall">밝기</Text>
      <View className="relative flex h-5 w-full justify-center rounded-xl bg-gray-200">
        <View className={`absolute mx-1 h-3 w-[${lightLevel}%] rounded-xl bg-sub2-300`} />
      </View>
      <Text className="ml-auto mt-1 text-sub2-300">{lightLevel / 10}</Text>
    </View>
  );
}
