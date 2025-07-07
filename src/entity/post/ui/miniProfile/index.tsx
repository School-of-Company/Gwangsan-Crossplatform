import { Image, Text, View } from 'react-native';

export default function MiniProfile() {
  return (
    <View className=" flex-row items-center justify-between border-b border-b-gray-100 px-6 py-3">
      <View className="flex-row gap-3">
        <Image className="h-[50px] w-[50px]" source={require('~/shared/assets/png/defaultProfile.png')} />
        <View className="gap-[5px]">
          <Text className="text-body3">모태환</Text>
          <Text>첨단 1동</Text>
        </View>
      </View>
      <Text className="text-body1 text-sub2-500">8단계</Text>
    </View>
  );
}
