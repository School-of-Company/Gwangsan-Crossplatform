import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onBack?: () => void;
  headerTitle: string;
}

export function Header({ onBack, headerTitle }: Props) {
  return (
    <View className="android:pt-10 flex-row items-center justify-between bg-white px-3" style={{}}>
      <TouchableOpacity onPress={onBack} className="w-10 items-center justify-center">
        <Icon name="chevron-back" size={24} color="#8F9094" />
      </TouchableOpacity>
      <Text className="flex-1 text-center text-body1 text-black">{headerTitle}</Text>
      <View className="size-6" />
    </View>
  );
}
