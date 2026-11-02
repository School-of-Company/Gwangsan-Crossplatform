import { Text, View, TouchableOpacity } from 'react-native';
import { CachedImage } from '~/shared/ui/CachedImage';
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
      accessibilityRole="button"
      accessibilityHint="작성자 프로필로 이동합니다"
      className="flex-row items-center justify-between border-b border-b-gray-100 px-6 py-4">
      <View className="flex-row items-center gap-3">
        <CachedImage
          className="h-[50px] w-[50px]"
          source={require('~/shared/assets/png/defaultProfile.png')}
          accessible
          accessibilityLabel={`${nickname} 프로필 사진`}
        />
        <View className="gap-[5px]">
          <Text className="text-body3 text-foreground">{nickname}</Text>
          <Text className="text-body5 text-gray-600">{placeName}</Text>
        </View>
      </View>
      <Text className={`text-body1 text-foreground`}>{light + '단계'}</Text>
    </TouchableOpacity>
  );
}
