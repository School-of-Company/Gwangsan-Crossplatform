import { router } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const styles = StyleSheet.create({
  commonCard: {
    backgroundColor: '#fff',
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
  dong?: string;
  place?: string;
}

export default function Inform({ dong, place }: InformProps) {
  return (
    <View className="flex gap-2 bg-white p-7">
      <Text className="text-titleSmall">{place}</Text>
      <Text className=" text-body2">{dong}</Text>
      <View className="flex w-full flex-row items-center justify-around pb-10">
        <TouchableOpacity
          onPress={() => handlePress('OBJECT')}
          style={styles.commonCard}
          className="flex h-full justify-between gap-5">
          <Ionicons name="bag-outline" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">물건</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress('SERVICE')}
          style={styles.commonCard}
          className="flex items-center justify-between gap-5">
          <MaterialCommunityIcons name="headset" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">서비스</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
