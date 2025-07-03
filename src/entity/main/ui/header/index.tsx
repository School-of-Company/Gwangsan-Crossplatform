import { Image, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Header() {
  return (
    <View className="flex flex-row justify-between border-b px-6 py-4">
      <Image
        source={require('~/shared/assets/png/logo.png')}
        className="h-[19px] w-[101px]"
        resizeMode="contain"
      />
      <Ionicons name="notifications-outline" size={24} color="#000" />
    </View>
  );
}
