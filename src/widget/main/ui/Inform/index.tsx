import { Text, View, StyleSheet } from 'react-native';
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
    height: '58%',
  },
});

export default function Inform() {
  return (
    <View className="flex gap-2 bg-white p-7">
      <Text className="text-titleSmall">광산구도시재생센터</Text>
      <Text className=" text-body2">수완세영</Text>
      <View className="flex w-full flex-row items-center justify-around">
        <View style={styles.commonCard} className="flex justify-between gap-5">
          <Ionicons name="bag-outline" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">물건</Text>
        </View>
        <View style={styles.commonCard} className="flex items-center justify-between gap-5">
          <MaterialCommunityIcons name="headset" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">서비스</Text>
        </View>
      </View>
    </View>
  );
}
