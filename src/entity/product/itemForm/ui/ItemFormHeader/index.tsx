import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

interface ItemFormHeaderProps {
  headerTitle: string;
  onBack?: () => void;
  onClose?: () => void;
  step: number;
}

const ItemFormHeader = ({ headerTitle, onBack, onClose, step }: ItemFormHeaderProps) => {
  const animatedValue = useRef(new Animated.Value(step)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: step,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, animatedValue]);

  return (
    <View>
      <View className="h-14 flex-row items-center justify-between bg-white px-3">
        <TouchableOpacity onPress={onBack} className="w-10 items-center justify-center">
          <Icon name="chevron-back" size={24} color="#8F9094" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-body2 text-black">{headerTitle}</Text>
        <TouchableOpacity onPress={onClose} className="w-10 items-center justify-center">
          <Icon name="close" size={24} color="#8F9094" />
        </TouchableOpacity>
      </View>
      <View className="h-2 w-full flex-row">
        <Animated.View
          className="bg-blue-300"
          style={{
            flex: animatedValue,
          }}
        />
        <Animated.View
          className="bg-gray-100"
          style={{
            flex: animatedValue.interpolate({
              inputRange: [1, 2, 3],
              outputRange: [2, 1, 0],
            }),
          }}
        />
      </View>
    </View>
  );
};

export default ItemFormHeader;
