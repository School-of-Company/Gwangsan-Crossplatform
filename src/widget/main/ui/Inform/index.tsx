import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Inform() {
  return (
    <View className="flex gap-2 bg-white p-7">
      <Text className="text-titleSmall">광산구도시재생센터</Text>
      <Text className="mb-16 text-body2">수완세영</Text>
      <View className="flex w-full flex-row justify-around gap-5">
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 5,
            minHeight: 160,
            minWidth: 160,
            alignItems: 'center',
          }}
          className="flex justify-between gap-5">
          <Ionicons name="bag-outline" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">물건</Text>
        </View>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 5,
            minHeight: 160,
            minWidth: 160,
          }}
          className="flex items-center justify-between gap-5">
          <MaterialCommunityIcons name="headset" size={44} color="black" />
          <Text className="font-cafe24 text-3xl">서비스</Text>
        </View>
      </View>
    </View>
  );
}
