import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Button } from '~/shared/ui/Button';
import { useSignout } from '~/entity/auth';

interface ProfileMenuProps {
  isMe: boolean;
  memberId?: number;
  name?: string;
}

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
      <View className="gap-2">
        <Button
          variant="neutral"
          width="w-full"
          onPress={() => router.push(`/profile/posts${idQuery}`)}>
          <Text className="text-gray-900">{isMe ? '내 글' : `${name ?? ''}님의 글`}</Text>
        </Button>
        <Button
          variant="neutral"
          width="w-full"
          onPress={() => router.push(`/profile/completedTrades${idQuery}`)}>
          <Text className="text-gray-900">거래 내역</Text>
        </Button>
        <Button
          variant="neutral"
          width="w-full"
          disabled={memberId == null}
          onPress={() => {
            if (memberId != null) router.push(`/reviews/${memberId}`);
          }}>
          <Text className="text-gray-900">후기</Text>
        </Button>
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
