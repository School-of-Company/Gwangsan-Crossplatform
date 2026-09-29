import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SelectionCard } from '~/shared/ui';

const handlePress = (where: string) => {
  router.push('/post?type=' + where);
};

interface InformProps {
  dong: string;
  place: string;
  head: string;
}

export default function Inform({ dong, place, head }: InformProps) {
  return (
    <View className="flex gap-2 bg-white p-7">
      <Text className="text-titleSmall">{head}</Text>
      <Text className="text-body2">{dong + ' ' + place}</Text>
      <View className="w-full flex-row gap-4 pb-10 pt-2">
        <SelectionCard
          icon={<Ionicons name="bag-outline" size={40} color="#3C3C3E" />}
          label="물건"
          onPress={() => handlePress('OBJECT')}
          className="aspect-square"
        />
        <SelectionCard
          icon={<MaterialCommunityIcons name="headset" size={40} color="#3C3C3E" />}
          label="서비스"
          onPress={() => handlePress('SERVICE')}
          className="aspect-square"
        />
      </View>
    </View>
  );
}
