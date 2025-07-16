import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSignout } from '~/entity/auth';

interface InformationProps {
  name?: string;
  id?: number;
  isMe: boolean;
}

export default function Information({ name, id }: InformationProps) {
  const R = useRouter();
  const { signout: handleSignout, isLoading } = useSignout();

  const handleEditProfile = useCallback(() => {
    R.push('/profile/edit' + `?id=${id}`);
  }, [R, id]);

  return (
    <View className="mb-3 flex flex-row justify-between bg-white p-6">
      <View className="flex flex-row gap-4">
        <Image
          source={require('~/shared/assets/png/defaultProfile.png')}
          width={50}
          height={50}
          resizeMode="contain"
        />
        <View>
          <Text className="mb-2 text-body1">{name ?? '사용자'}</Text>
          <TouchableOpacity
            onPress={handleSignout}
            className="flex flex-row items-center gap-3"
            disabled={isLoading}>
            <Text className="text-label text-gray-500">
              {isLoading ? '로그아웃 중...' : '로그아웃하기'}
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#8F9094" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleEditProfile}
        className="flex justify-center rounded-[30px] border border-main-500 px-4 py-[10px]">
        <Text className="text-main-500">내 정보 수정</Text>
      </TouchableOpacity>
    </View>
  );
}
