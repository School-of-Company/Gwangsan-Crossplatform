import { Text, View } from 'react-native';

export default function Light() {
  return (
    <View className="mb- px-6 py-10">
      <Text className="mb-6 text-titleSmall">밝기</Text>
      <View className="relative flex h-5 w-full justify-center">
        <View className="absolute h-5 w-full rounded-xl bg-gray-200 "></View>
        <View className="max- absolute mx-1 h-3 w-3/5 rounded-xl bg-sub2-300"></View>
      </View>
      <Text className="ml-auto mt-1 text-sub2-300">8단계</Text>
    </View>
  );
}
