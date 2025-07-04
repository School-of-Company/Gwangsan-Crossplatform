import { Image, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Information() {
  return (
    <View className="flex flex-row justify-between bg-white p-6">
      <View className="flex flex-row gap-4">
        <Image
          source={require('~/shared/assets/png/defaultProfile.png')}
          width={50}
          height={50}
          resizeMode="contain"
        />
        <View>
          <Text className="mb-2 text-body1">모태환</Text>
          <View className="flex flex-row items-center gap-3">
            <Text className="text-label text-gray-500">로그아웃하기 </Text>
            <Ionicons name="chevron-forward" size={24} color="#8F9094" />
          </View>
        </View>
      </View>
      <TouchableOpacity className="flex justify-center rounded-3xl border border-main-500 px-4">
        <Text className="text-main-500">내 정보 수정</Text>
      </TouchableOpacity>
    </View>
  );
}
