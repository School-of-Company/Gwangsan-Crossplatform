import { Text, TouchableOpacity, View } from 'react-native';
import { CachedImage } from '~/shared/ui/CachedImage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColors } from '~/shared/lib/theme';

interface ProfileHeaderProps {
  name?: string;
  isMe: boolean;
  isMenuDisabled: boolean;
  onEditProfile: () => void;
  onMenuPress: () => void;
}

export default function ProfileHeader({
  name,
  isMe,
  isMenuDisabled,
  onEditProfile,
  onMenuPress,
}: ProfileHeaderProps) {
  const colors = useThemeColors();
  if (isMe) {
    return (
      <TouchableOpacity
        testID="Information-edit-button"
        onPress={onEditProfile}
        accessibilityRole="button"
        accessibilityHint="내 정보 수정 화면으로 이동합니다"
        className="mx-6 mb-3 flex flex-row items-center justify-between rounded-xl bg-surface-muted p-6">
        <View className="flex flex-row items-center gap-4">
          <CachedImage
            source={require('~/shared/assets/png/defaultProfile.png')}
            contentFit="contain"
            className="h-[50px] w-[50px] rounded-full"
            accessible
            accessibilityLabel="내 프로필 사진"
          />
          <Text testID="Information-nickname" className="text-body1 text-foreground">
            {name ?? '사용자'}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors['gray-400']} />
      </TouchableOpacity>
    );
  }

  return (
    <View className="mx-6 mb-3 flex flex-row justify-between rounded-xl bg-surface-muted p-6">
      <View className="flex flex-row gap-4">
        <CachedImage
          source={require('~/shared/assets/png/defaultProfile.png')}
          contentFit="contain"
          className="h-[50px] w-[50px] rounded-full"
          accessible
          accessibilityLabel={`${name ?? '사용자'} 프로필 사진`}
        />
        <View className="flex-row items-center gap-4">
          <Text testID="Information-nickname" className="text-body1 text-foreground">
            {name ?? '사용자'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onMenuPress}
        disabled={isMenuDisabled}
        accessibilityRole="button"
        accessibilityLabel="사용자 메뉴 더보기"
        accessibilityState={{ disabled: isMenuDisabled }}
        className="flex justify-center px-2 py-2">
        <MaterialIcons name="more-vert" size={28} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}
