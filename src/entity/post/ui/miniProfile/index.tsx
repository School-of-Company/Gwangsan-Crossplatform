import { Image, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface MiniProfileProps {
  nickname: string;
  placeName: string;
  light: number;
  memberId: number;
}

export default function MiniProfile({ nickname, placeName, light, memberId }: MiniProfileProps) {
  const router = useRouter();

  const handleProfilePress = () => {
    router.push(`/profile?id=${memberId}`);
  };

  return (
    <TouchableOpacity
      onPress={handleProfilePress}
      className="flex-row items-center justify-between border-y border-y-gray-100 px-6 py-4">
      <View className="flex-row gap-3">
        <Image
          className="h-[50px] w-[50px]"
          source={require('~/shared/assets/png/defaultProfile.png')}
        />
        <View className="gap-[5px]">
          <Text className="text-body3">{nickname}</Text>
          <Text className="text-body5 text-gray-600">{placeName}</Text>
        </View>
      </View>
      <Text className={`text-body1`}>{light + '단계'}</Text>
    </TouchableOpacity>
  );
}
