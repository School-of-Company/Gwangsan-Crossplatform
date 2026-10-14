import { Image, Text, TouchableOpacity, View } from 'react-native';
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
        className="mx-6 mb-3 flex flex-row items-center justify-between rounded-xl bg-surface-muted p-6">
        <View className="flex flex-row items-center gap-4">
          <Image
            source={require('~/shared/assets/png/defaultProfile.png')}
            width={50}
            height={50}
            resizeMode="contain"
            className="rounded-full"
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
        <Image
          source={require('~/shared/assets/png/defaultProfile.png')}
          width={50}
          height={50}
          resizeMode="contain"
          className="rounded-full"
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
        className="flex justify-center px-2 py-2">
        <MaterialIcons name="more-vert" size={28} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}
