import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSignout, useWithdrawal } from '~/entity/auth';
import { ReportModal } from '~/entity/post/ui';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { useBlockUser } from '~/view/profile/model/useBlockUser';

interface InformationProps {
  name?: string;
  id?: number;
  isMe: boolean;
  isBlocked?: boolean;
}

export default function Information({ name, id, isMe, isBlocked = false }: InformationProps) {
  const R = useRouter();
  const { signout: handleSignout, isLoading: isSignoutLoading } = useSignout();
  const { withdrawal: handleWithdrawal, isLoading: isWithdrawalLoading } = useWithdrawal();
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isReportVisible, setIsReportVisible] = useState(false);
  const { block, unblock } = useBlockUser(id);

  const handleEditProfile = useCallback(() => {
    R.push(`/profile/${id}/edit`);
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

  const handleMenuPress = useCallback(() => {
    setIsMenuVisible(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  const handleBlockPress = useCallback(() => {
    setIsMenuVisible(false);
    if (isBlocked) {
      Alert.alert('차단 해제', `${name}님의 차단을 해제하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        { text: '해제', onPress: () => unblock.mutate() },
      ]);
    } else {
      Alert.alert('사용자 차단', `${name}님을 차단하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        { text: '차단', style: 'destructive', onPress: () => block.mutate() },
      ]);
    }
  }, [isBlocked, name, block, unblock]);

  const handleReportPress = useCallback(() => {
    setIsMenuVisible(false);
    setIsReportVisible(true);
  }, []);

  const handleCloseReport = useCallback(() => {
    setIsReportVisible(false);
  }, []);

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
          <TouchableOpacity
            onPress={handleMenuPress}
            disabled={block.isPending || unblock.isPending}
            className="flex justify-center px-2 py-2">
            <MaterialIcons name="more-vert" size={28} color="#374151" />
          </TouchableOpacity>
        )}
      </View>

      <BottomSheetModalWrapper
        isVisible={isMenuVisible}
        onClose={handleCloseMenu}
        title=""
        hasHeader={false}
        height={230}>
        <View className="gap-8">
          <TouchableOpacity
            onPress={handleBlockPress}
            disabled={block.isPending || unblock.isPending}
            className="items-center py-4">
            <Text className="text-lg">{isBlocked ? '차단 해제하기' : '차단하기'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReportPress} className="items-center py-4">
            <Text className="text-lg">신고하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCloseMenu} className="items-center py-4">
            <Text className="text-lg text-red-500">취소</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModalWrapper>

      <ReportModal memberId={id} isVisible={isReportVisible} onClose={handleCloseReport} />

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
