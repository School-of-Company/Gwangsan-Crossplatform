import { View, TouchableOpacity, Text } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

interface Props {
  onBack?: () => void;
  headerTitle: string;
  onTitlePress?: () => void;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  showBackButton?: boolean;
  connectionState?: 'connected' | 'connecting' | 'disconnected';
}

export function Header({
  onBack,
  headerTitle,
  onTitlePress,
  onMenuPress,
  showMenuButton = false,
  showBackButton = true,
  connectionState,
}: Props) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const connectionDot = connectionState !== undefined && (
    <View
      className="size-2 rounded-full"
      style={{
        backgroundColor:
          connectionState === 'connected'
            ? '#22C55E'
            : connectionState === 'connecting'
              ? '#F59E0B'
              : '#EF4444',
      }}
    />
  );

  return (
    <View className="flex-row items-center justify-between px-3 py-6">
      <TouchableOpacity
        onPress={handleBack}
        disabled={!showBackButton}
        className={
          showBackButton
            ? 'w-10 items-center justify-center'
            : 'w-10 items-center justify-center opacity-0'
        }>
        <Icon name="chevron-back" size={24} color="#8F9094" />
      </TouchableOpacity>
      <View className="flex-1 flex-row items-center justify-center gap-2">
        {onTitlePress ? (
          <TouchableOpacity
            onPress={onTitlePress}
            className="flex-row items-center justify-center gap-2">
            <Text className="text-center text-body1 text-black">{headerTitle}</Text>
            {connectionDot}
          </TouchableOpacity>
        ) : (
          <>
            <Text className="text-center text-body1 text-black">{headerTitle}</Text>
            {connectionDot}
          </>
        )}
      </View>
      {showMenuButton ? (
        <TouchableOpacity onPress={onMenuPress} className="w-10 items-center justify-center">
          <Icon name="ellipsis-vertical" size={24} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
