import { TouchableOpacity, View } from 'react-native';
import { CachedImage } from '~/shared/ui/CachedImage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useThemeColors } from '~/shared/lib/theme';

export default function Header() {
  const r = useRouter();
  const colors = useThemeColors();

  const handlePressNotification = useCallback(() => {
    r.push('/notification');
  }, [r]);

  return (
    <View className="flex flex-row justify-between border-b border-gray-400 px-6 py-4">
      <CachedImage
        source={require('~/shared/assets/png/logo.png')}
        className="h-[19px] w-[101px]"
        contentFit="contain"
        accessible
        accessibilityRole="header"
        accessibilityLabel="시민화폐 광산"
      />
      <TouchableOpacity
        onPress={handlePressNotification}
        accessibilityRole="button"
        accessibilityLabel="알림"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}
