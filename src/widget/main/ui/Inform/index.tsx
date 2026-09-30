import { router } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useThemeColors } from '~/shared/lib/theme';

const styles = StyleSheet.create({
  commonCard: {
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 2,
    alignItems: 'center',
    width: '40%',
    height: '64%',
  },
});

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
      <View className="flex w-full flex-row items-center justify-around pb-10">
        <TouchableOpacity
          onPress={() => handlePress('OBJECT')}
          style={[styles.commonCard, { backgroundColor: colors.surface }]}
          className="flex h-full justify-between gap-5">
          <Ionicons name="bag-outline" size={44} color={colors.foreground} />
          <Text className="font-cafe24 text-3xl text-foreground">물건</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress('SERVICE')}
          style={[styles.commonCard, { backgroundColor: colors.surface }]}
          className="flex items-center justify-between gap-5">
          <MaterialCommunityIcons name="headset" size={44} color={colors.foreground} />
          <Text className="font-cafe24 text-3xl text-foreground">서비스</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
