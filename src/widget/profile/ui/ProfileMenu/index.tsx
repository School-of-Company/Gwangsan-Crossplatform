import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Button } from '~/shared/ui/Button';
import { useSignout } from '~/entity/auth';

interface ProfileMenuProps {
  isMe: boolean;
  memberId?: number;
  name?: string;
}

interface TradeMenuRowProps {
  label: string;
  isLast?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

const TradeMenuRow = ({ label, isLast = false, disabled = false, onPress }: TradeMenuRowProps) => (
  <TouchableOpacity
    activeOpacity={0.7}
    disabled={disabled}
    onPress={onPress}
    className={`h-[56px] flex-row items-center justify-between bg-[#F3F4F5] px-6 ${
      isLast ? '' : 'border-b border-gray-200'
    } ${disabled ? 'opacity-50' : ''}`}>
    <Text className="text-body2 text-gray-900">{label}</Text>
    <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function ProfileMenu({ isMe, memberId, name }: ProfileMenuProps) {
  const router = useRouter();
  const { signout, isLoading: isSignoutLoading } = useSignout();

  const idQuery = !isMe && memberId != null ? `?id=${memberId}` : '';
  const appVersion = Constants.expoConfig?.version;

  const handleLogoutPress = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signout() },
    ]);
  };

  return (
    <View className="mx-6 mt-3 gap-6">
      <View className="gap-3">
        <Text className="px-1 text-titleSmall">
          {isMe ? '나의 거래' : `${name ?? ''}님의 거래`}
        </Text>
        <View className="overflow-hidden rounded-xl">
          <TradeMenuRow
            label={isMe ? '내 글' : `${name ?? ''}님의 글`}
            onPress={() => router.push(`/profile/posts${idQuery}`)}
          />
          <TradeMenuRow
            label="거래 내역"
            onPress={() => router.push(`/profile/completedTrades${idQuery}`)}
          />
          <TradeMenuRow
            label="후기"
            isLast
            disabled={memberId == null}
            onPress={() => {
              if (memberId != null) router.push(`/reviews/${memberId}`);
            }}
          />
        </View>
      </View>

      {appVersion && (
        <Button variant="neutral" width="w-full">
          <Text className="text-gray-900">버전 {appVersion}</Text>
        </Button>
      )}

      {isMe && (
        <Button
          variant="neutral"
          width="w-full"
          disabled={isSignoutLoading}
          onPress={handleLogoutPress}>
          <Text className="text-error-500">{isSignoutLoading ? '로그아웃 중...' : '로그아웃'}</Text>
        </Button>
      )}
    </View>
  );
}
