import { Text, View } from 'react-native';

interface ErrorMessageProps {
  error?: string | null;
  className?: string;
}

export function ErrorMessage({ error, className = "h-6" }: ErrorMessageProps) {
  return (
    <View className={className}>
      {error && (
        <Text className="text-red-500 text-sm">
          {error}
        </Text>
      )}
    </View>
  );
} 