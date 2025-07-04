import { Image, Text, View } from 'react-native';

export default function ReviewPost() {
  return (
    <View className="flex flex-row gap-9 px-6">
      <Image
        source={require('@/shared/assets/png/onboardingSlide1.png')}
        className="size-24 rounded-lg"
      />
      <View>
        <View className="relative mb-3 flex w-1/2 justify-center">
          <View className="absolute h-3 w-full rounded-xl bg-gray-200 "></View>
          <View className="max- absolute mx-0.5 h-2 w-3/5 rounded-xl  bg-sub2-300"></View>
        </View>
        <Text className="mb-1 max-w-[200px] flex-wrap text-label text-[#555555]">
          핸드폰 컬러가 마음에 들고 상태도 매우 좋아요
        </Text>
        <Text className="text-label">모태환</Text>
      </View>
    </View>
  );
}
