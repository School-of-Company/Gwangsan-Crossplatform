import { useCallback, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AlertModal } from '~/shared/ui/AlertModal';
import { useSignout, useWithdrawal } from '~/entity/auth';

interface ProfileMenuProps {
  isMe: boolean;
  memberId?: number;
}

interface PressableCardRowProps {
  disabled?: boolean;
  onPress?: () => void;
  rowClassName: string;
  children: React.ReactNode;
}

const PressableCardRow = ({
  disabled = false,
  onPress,
  rowClassName,
  children,
}: PressableCardRowProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={disabled ? 'opacity-50' : ''}>
      <Animated.View className={`h-[56px] ${rowClassName}`} style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

interface TradeMenuRowProps {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}

const TradeMenuRow = ({ label, disabled = false, onPress }: TradeMenuRowProps) => (
  <PressableCardRow
    disabled={disabled}
    onPress={onPress}
    rowClassName="flex-row items-center justify-between px-6">
    <Text className="text-lg font-medium text-gray-900">{label}</Text>
    <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
  </PressableCardRow>
);

interface ProfileActionRowProps {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
}

const ProfileActionRow = ({ label, disabled = false, onPress }: ProfileActionRowProps) => (
  <PressableCardRow
    disabled={disabled}
    onPress={onPress}
    rowClassName="items-center justify-center">
    <Text className="text-lg font-medium text-error-500">{label}</Text>
  </PressableCardRow>
);

export default function ProfileMenu({ isMe, memberId }: ProfileMenuProps) {
  const router = useRouter();
  const { signout, isLoading: isSignoutLoading } = useSignout();
  const { withdrawal, isLoading: isWithdrawalLoading } = useWithdrawal();
  const [isLogoutAlertVisible, setIsLogoutAlertVisible] = useState(false);
  const [isWithdrawalAlertVisible, setIsWithdrawalAlertVisible] = useState(false);

  const idQuery = !isMe && memberId != null ? `?id=${memberId}` : '';
  const appVersion = Constants.expoConfig?.version;
  const isActionDisabled = isSignoutLoading || isWithdrawalLoading;

  const handleLogoutPress = () => {
    setIsLogoutAlertVisible(true);
  };

  const handleLogoutCancel = () => {
    setIsLogoutAlertVisible(false);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutAlertVisible(false);
    signout();
  };

  const handleWithdrawalPress = () => {
    setIsWithdrawalAlertVisible(true);
  };

  const handleWithdrawalCancel = () => {
    setIsWithdrawalAlertVisible(false);
  };

  const handleWithdrawalConfirm = () => {
    setIsWithdrawalAlertVisible(false);
    withdrawal();
  };

  return (
    <View className="mx-6 mt-3 gap-4">
      <View className="overflow-hidden rounded-xl bg-[#F3F4F5]">
        <TradeMenuRow label="판매관리" onPress={() => router.push(`/profile/selling${idQuery}`)} />
        <TradeMenuRow
          label="거래내역"
          onPress={() => router.push(`/profile/purchased${idQuery}`)}
        />
        <TradeMenuRow
          label="후기"
          disabled={memberId == null}
          onPress={() => {
            if (memberId != null) router.push(`/reviews/${memberId}`);
          }}
        />
        {isMe && <TradeMenuRow label="차단 목록" onPress={() => router.push('/profile/blocked')} />}
      </View>

      {appVersion && (
        <View className="h-[56px] w-full flex-row items-center justify-between rounded-xl bg-[#F3F4F5] px-6">
          <Text className="text-lg font-medium text-gray-900">버전</Text>
          <Text className="text-lg font-medium text-gray-900">{appVersion}</Text>
        </View>
      )}

      {isMe && (
        <View className="overflow-hidden rounded-xl bg-[#F3F4F5]" style={{ marginBottom: 32 }}>
          <ProfileActionRow
            label={isWithdrawalLoading ? '회원탈퇴 중...' : '회원탈퇴'}
            disabled={isActionDisabled}
            onPress={handleWithdrawalPress}
          />
          <ProfileActionRow
            label={isSignoutLoading ? '로그아웃 중...' : '로그아웃'}
            disabled={isActionDisabled}
            onPress={handleLogoutPress}
          />
        </View>
      )}

      <AlertModal
        isVisible={isLogoutAlertVisible}
        message={'정말로\n로그아웃 하시겠어요?'}
        confirmText="로그아웃"
        destructive
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />

      <AlertModal
        isVisible={isWithdrawalAlertVisible}
        message={'정말로 탈퇴하시겠어요?\n탈퇴 시 모든 데이터가 삭제됩니다.'}
        confirmText="탈퇴"
        destructive
        onCancel={handleWithdrawalCancel}
        onConfirm={handleWithdrawalConfirm}
      />
    </View>
  );
}
