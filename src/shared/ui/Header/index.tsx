import { View, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { router } from 'expo-router';

interface Props {
  onBack?: () => void;
  headerTitle: string;
  onTitlePress?: () => void;
}

export function Header({ onBack, headerTitle, onTitlePress }: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-3 py-6">
      <TouchableOpacity onPress={handleBack} className="w-10 items-center justify-center">
        <Icon name="chevron-back" size={24} color="#8F9094" />
      </TouchableOpacity>
      {onTitlePress ? (
        <TouchableOpacity onPress={onTitlePress} className="flex-1">
          <Text className="text-center text-body1 text-black">{headerTitle}</Text>
        </TouchableOpacity>
      ) : (
        <Text className="flex-1 text-center text-body1 text-black">{headerTitle}</Text>
      )}
      <View className="size-6" />
    </View>
  );
}
