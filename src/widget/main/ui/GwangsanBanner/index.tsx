import { Text, View } from 'react-native';
import { CachedImage } from '~/shared/ui/CachedImage';

interface GwangsanBannerProps {
  gwangsan?: number;
}

export default function GwangsanBanner({ gwangsan }: GwangsanBannerProps) {
  return (
    <View className="flex flex-row items-center gap-3 bg-background px-6 py-5">
      <CachedImage
        source={require('~/shared/assets/png/Gwangsan.png')}
        style={{ width: 48, height: 44 }}
        contentFit="contain"
        accessible
        accessibilityLabel="광산 화폐 아이콘"
      />
      <View className="flex gap-1">
        <Text className="text-body1 text-foreground">광산</Text>
        <Text className="font-cafe24 text-titleMedium text-sub2-700">{gwangsan ?? 0}</Text>
      </View>
    </View>
  );
}
