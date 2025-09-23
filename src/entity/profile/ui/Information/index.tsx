import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSignout, useWithdrawal } from '~/entity/auth';
import { BottomSheetModalWrapper } from '~/shared/ui';

interface InformationProps {
  name?: string;
  id?: number;
  isMe: boolean;
}

export default function Information({ name, id, isMe }: InformationProps) {
  const R = useRouter();
  const { signout: handleSignout, isLoading: isSignoutLoading } = useSignout();
  const { withdrawal: handleWithdrawal, isLoading: isWithdrawalLoading } = useWithdrawal();
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const handleEditProfile = useCallback(() => {
    R.push(`/profile?id=${id}/edit`);
  }, [R, id]);

  const handleLogoutIconPress = useCallback(() => {
    setIsBottomSheetVisible(true);
  }, []);

  const handleCloseBottomSheet = useCallback(() => {
    setIsBottomSheetVisible(false);
  }, []);

  const handleLogoutPress = useCallback(() => {
    handleSignout();
    setIsBottomSheetVisible(false);
  }, [handleSignout]);

  const handleWithdrawalPress = useCallback(() => {
    handleWithdrawal();
    setIsBottomSheetVisible(false);
  }, [handleWithdrawal]);

  return (
    <>
      <View className="mb-3 flex flex-row justify-between bg-white p-6">
        <View className="flex flex-row gap-4">
          <Image
            source={require('~/shared/assets/png/defaultProfile.png')}
            width={50}
            height={50}
            resizeMode="contain"
          />
          <View className="flex-row items-center gap-4">
            <Text className="text-body1">{name ?? '사용자'}</Text>
            {isMe && (
              <TouchableOpacity
                onPress={handleLogoutIconPress}
                className="flex flex-row items-center gap-3"
                disabled={isSignoutLoading || isWithdrawalLoading}>
                <MaterialIcons name="logout" size={24} color="#DF454A" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {isMe ? (
          <TouchableOpacity
            onPress={handleEditProfile}
            className="flex justify-center rounded-[30px] border border-main-500 px-4 py-[10px]">
            <Text className="text-main-500">내 정보 수정</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity className="flex justify-center rounded-[30px] px-4 py-[10px]"></TouchableOpacity>
        )}
      </View>

      <BottomSheetModalWrapper
        isVisible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        title=""
        hasHeader={false}
        height={270}>
        <View className="gap-8">
          <TouchableOpacity
            onPress={handleLogoutPress}
            disabled={isSignoutLoading || isWithdrawalLoading}
            className="items-center py-4">
            <Text className="text-lg text-red-500">
              {isSignoutLoading ? '로그아웃 중...' : '로그아웃'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWithdrawalPress}
            disabled={isSignoutLoading || isWithdrawalLoading}
            className="items-center py-4">
            <Text className="text-lg text-red-500">
              {isWithdrawalLoading ? '회원탈퇴 중...' : '회원탈퇴'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCloseBottomSheet}
            disabled={isSignoutLoading || isWithdrawalLoading}
            className="items-center py-4">
            <Text className="text-lg text-gray-700">취소</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModalWrapper>
    </>
  );
}
