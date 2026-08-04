import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  GestureResponderEvent,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSignout, useWithdrawal } from '~/entity/auth';
import { ReportModal } from '~/entity/post/ui';
import { BottomSheetModalWrapper, Button } from '~/shared/ui';
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
  const logoutScale = useRef(new Animated.Value(1)).current;
  const withdrawalScale = useRef(new Animated.Value(1)).current;

  const animateScale = useCallback((scale: Animated.Value, toValue: number) => {
    Animated.timing(scale, { toValue, duration: 100, useNativeDriver: true }).start();
  }, []);

  const handleLogoutPressIn = useCallback(
    (_e: GestureResponderEvent) => animateScale(logoutScale, 0.96),
    [animateScale, logoutScale]
  );
  const handleLogoutPressOut = useCallback(
    (_e: GestureResponderEvent) => animateScale(logoutScale, 1),
    [animateScale, logoutScale]
  );
  const handleWithdrawalPressIn = useCallback(
    (_e: GestureResponderEvent) => animateScale(withdrawalScale, 0.96),
    [animateScale, withdrawalScale]
  );
  const handleWithdrawalPressOut = useCallback(
    (_e: GestureResponderEvent) => animateScale(withdrawalScale, 1),
    [animateScale, withdrawalScale]
  );

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
    Alert.alert('회원탈퇴', '정말로 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: () => {
          handleWithdrawal();
          setIsBottomSheetVisible(false);
        },
      },
    ]);
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
            <Text testID="Information-nickname" className="text-body1">
              {name ?? '사용자'}
            </Text>
            {isMe && (
              <TouchableOpacity
                testID="Information-logout-button"
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
        height={260}>
        <View className="flex-1 justify-center">
          <View className="overflow-hidden rounded-xl bg-white">
            <TouchableOpacity
              onPress={handleLogoutPress}
              onPressIn={handleLogoutPressIn}
              onPressOut={handleLogoutPressOut}
              disabled={isSignoutLoading || isWithdrawalLoading}
              activeOpacity={1}
              className="border-b border-gray-200">
              <Animated.View
                className={`h-[52px] items-center justify-center px-8 py-3 ${
                  isSignoutLoading || isWithdrawalLoading ? 'bg-[#CDCDCF]' : 'bg-[#F3F4F5]'
                }`}
                style={{ transform: [{ scale: logoutScale }] }}>
                <Text
                  className={`text-lg font-semibold ${
                    isSignoutLoading || isWithdrawalLoading ? 'text-gray-500' : 'text-red-500'
                  }`}>
                  {isSignoutLoading ? '로그아웃 중...' : '로그아웃'}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWithdrawalPress}
              onPressIn={handleWithdrawalPressIn}
              onPressOut={handleWithdrawalPressOut}
              disabled={isSignoutLoading || isWithdrawalLoading}
              activeOpacity={1}>
              <Animated.View
                className={`h-[52px] items-center justify-center px-8 py-3 ${
                  isSignoutLoading || isWithdrawalLoading ? 'bg-[#CDCDCF]' : 'bg-[#F3F4F5]'
                }`}
                style={{ transform: [{ scale: withdrawalScale }] }}>
                <Text
                  className={`text-lg font-semibold ${
                    isSignoutLoading || isWithdrawalLoading ? 'text-gray-500' : 'text-red-500'
                  }`}>
                  {isWithdrawalLoading ? '회원탈퇴 중...' : '회원탈퇴'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View className="mt-3">
            <Button
              variant="neutral"
              onPress={handleCloseBottomSheet}
              disabled={isSignoutLoading || isWithdrawalLoading}
              width="w-full">
              <Text className="text-gray-900">닫기</Text>
            </Button>
          </View>
        </View>
      </BottomSheetModalWrapper>
    </>
  );
}
