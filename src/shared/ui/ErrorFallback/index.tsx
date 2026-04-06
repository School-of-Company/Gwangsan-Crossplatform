import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorFallbackProps {
  onRetry?: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
      <Text className="text-center text-lg font-semibold text-gray-800">오류가 발생했습니다</Text>
      <Text className="text-center text-sm text-gray-500">잠시 후 다시 시도해 주세요.</Text>
      <TouchableOpacity className="rounded-xl bg-main-500 px-8 py-3" onPress={onRetry}>
        <Text className="font-semibold text-white">다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
}
