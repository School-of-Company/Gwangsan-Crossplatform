import { Image, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function Header() {
  const r = useRouter();
  return (
    <View className="flex flex-row justify-between border-b border-gray-400 px-6 py-4">
      <Image
        source={require('~/shared/assets/png/logo.png')}
        className="h-[19px] w-[101px]"
        resizeMode="contain"
      />
      <Ionicons
        onPress={() => r.push('/notification')}
        name="notifications-outline"
        size={24}
        color="#000"
      />
    </View>
  );
}
