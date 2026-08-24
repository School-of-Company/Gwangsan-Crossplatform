import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '~/shared/ui/Card';
import { MenuRow } from '~/shared/ui/MenuRow';
import { useSignout } from '~/entity/auth';

interface ProfileMenuProps {
  isMe: boolean;
  memberId?: number;
  name?: string;
}

export default function ProfileMenu({ isMe, memberId, name }: ProfileMenuProps) {
  const router = useRouter();
  const { signout, isLoading: isSignoutLoading } = useSignout();

  const idQuery = memberId != null ? `?id=${memberId}` : '';

  const handleLogoutPress = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signout() },
    ]);
  };

  return (
    <Card padding="none" className="mx-6 mt-3 overflow-hidden">
      <MenuRow
        label={isMe ? '내 글' : `${name ?? ''}님의 글`}
        onPress={() => router.push(`/profile/posts${idQuery}`)}
      />
      <MenuRow
        label="거래 완료 품목"
        onPress={() => router.push(`/profile/completedTrades${idQuery}`)}
      />
      <MenuRow
        label="후기"
        isLast={!isMe}
        disabled={memberId == null}
        onPress={() => {
          if (memberId != null) router.push(`/reviews/${memberId}`);
        }}
      />
      {isMe && (
        <MenuRow
          label={isSignoutLoading ? '로그아웃 중...' : '로그아웃'}
          isLast
          showChevron={false}
          labelClassName="text-error-500"
          disabled={isSignoutLoading}
          onPress={handleLogoutPress}
        />
      )}
    </Card>
  );
}
