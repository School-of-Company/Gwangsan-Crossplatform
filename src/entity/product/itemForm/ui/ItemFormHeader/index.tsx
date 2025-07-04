import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ItemFormHeaderProps {
  title?: string;
  onBack?: () => void;
  onClose?: () => void;
  step: number;
}

const ItemFormHeader = ({ title = '필요해요', onBack, onClose, step }: ItemFormHeaderProps) => {
  return (
    <View>
      <View className="h-14 flex-row items-center justify-between px-3">
        <TouchableOpacity onPress={onBack} className="w-10 items-center justify-center">
          <Icon name="chevron-back" size={24} color="#8F9094" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-titleSmall text-black">{title}</Text>
        <TouchableOpacity onPress={onClose} className="w-10 items-center justify-center">
          <Icon name="close" size={24} color="#8F9094" />
        </TouchableOpacity>
      </View>
      <View className="h-2 w-full flex-row">
        <View style={{ flex: step, backgroundColor: '#5AA9E6' }} />
        <View style={{ flex: 3 - step, backgroundColor: '#F2F2F2' }} />
      </View>
    </View>
  );
};

export default ItemFormHeader;
