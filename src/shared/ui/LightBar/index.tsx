import { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LightBarProps {
  value: number;
}

const GRADIENT_COLORS = ['#F6AC01', '#8FC31D'] as const;

export const LightBar = ({ value }: LightBarProps) => {
  const width = Math.min(Math.max(value, 0), 100);
  const [trackWidth, setTrackWidth] = useState(0);

  return (
    <View className="relative h-4 w-full justify-center rounded-xl bg-gray-100">
      <View
        className="absolute left-0.5 right-0.5 h-3 overflow-hidden rounded-xl"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
        <View style={{ width: `${width}%`, height: '100%', overflow: 'hidden' }}>
          {trackWidth > 0 && (
            <LinearGradient
              colors={GRADIENT_COLORS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: trackWidth, height: '100%' }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default LightBar;
