import { Text, TouchableOpacity, View } from 'react-native';

interface ErrorFallbackProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  onRetry,
  title = '오류가 발생했습니다',
  message = '잠시 후 다시 시도해 주세요.',
}: ErrorFallbackProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-center text-lg font-semibold text-gray-800">{title}</Text>
      <Text className="text-center text-sm text-gray-500">{message}</Text>
      <TouchableOpacity
        testID="error-fallback-retry"
        accessibilityRole="button"
        className="rounded-xl bg-main-500 px-8 py-3"
        onPress={onRetry}>
        <Text className="font-semibold text-white">다시 시도</Text>
      </TouchableOpacity>
    </View>
  );
}
