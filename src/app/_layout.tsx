import { Stack } from 'expo-router';
import { View } from 'react-native';
import '../../global.css';
import { useCustomFonts } from '@/shared/assets/fonts/fontLoader';

export default function RootLayout() {
  const fontsLoaded = useCustomFonts();
  if (!fontsLoaded) return null;
  return (
    <View className="mb-6 flex-1 bg-white">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </View>
  );
}
