import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SelectionCard } from '~/shared/ui';
import { useThemeColors } from '~/shared/lib/theme';

const handlePress = (where: string) => {
  router.push('/post?type=' + where);
};

interface InformProps {
  dong: string;
  place: string;
  head: string;
}

export default function Inform({ dong, place, head }: InformProps) {
  const colors = useThemeColors();
  return (
    <View className="flex gap-2 bg-background p-7">
      <Text className="text-titleSmall text-foreground">{head}</Text>
      <Text className="text-body2 text-foreground">{dong + ' ' + place}</Text>
      <View className="w-full flex-row gap-4 pb-10 pt-2">
        <SelectionCard
          icon={<Ionicons name="bag-outline" size={40} color={colors.foreground} />}
          label="물건"
          onPress={() => handlePress('OBJECT')}
          className="aspect-square"
        />
        <SelectionCard
          icon={<MaterialCommunityIcons name="headset" size={40} color={colors.foreground} />}
          label="서비스"
          onPress={() => handlePress('SERVICE')}
          className="aspect-square"
        />
      </View>
    </View>
  );
}
