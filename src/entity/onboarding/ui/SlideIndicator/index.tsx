import { View } from 'react-native';

interface SlideIndicatorProps {
  total: number;
  current: number;
}

const SlideIndicator = ({ total, current }: SlideIndicatorProps) => (
  <View className="mt-4 flex-row items-center justify-center space-x-2">
    {Array.from({ length: total }).map((_, idx) => (
      <View
        key={idx}
        className={`h-3 w-3 rounded-full ${idx === current ? 'bg-lime-500' : 'bg-gray-300'}`}
      />
    ))}
  </View>
);

export default SlideIndicator;
