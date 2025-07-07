import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  onBack?: () => void;
  headerTitle: string;
}

export function Header({ onBack, headerTitle }: Props) {
  return (
    <View className="h-14 flex-row items-center justify-between bg-white px-3">
      <TouchableOpacity onPress={onBack} className="w-10 items-center justify-center">
        <Icon name="chevron-back" size={24} color="#8F9094" />
      </TouchableOpacity>
      <Text className="flex-1 text-center text-body1 text-black">{headerTitle}</Text>
      <View className="size-6" />
    </View>
  );
}
