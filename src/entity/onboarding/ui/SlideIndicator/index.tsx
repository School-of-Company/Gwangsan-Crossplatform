import { View, TouchableOpacity } from 'react-native';

interface SlideIndicatorProps {
  total: number;
  current: number;
  onPress?: (idx: number) => void;
}

const SlideIndicator = ({ total, current, onPress }: SlideIndicatorProps) => (
  <View className="mt-4 flex-row items-center justify-center gap-2">
    {Array.from({ length: total }).map((_, idx) => {
      const dot = (
        <View
          key={idx}
          className={`rounded-full ${idx === current ? 'h-3 w-3 bg-lime-500' : 'h-2 w-2 bg-gray-300'}`}
        />
      );
      return onPress ? (
        <TouchableOpacity key={idx} onPress={() => onPress(idx)}>
          {dot}
        </TouchableOpacity>
      ) : (
        dot
      );
    })}
  </View>
);

export default SlideIndicator;
