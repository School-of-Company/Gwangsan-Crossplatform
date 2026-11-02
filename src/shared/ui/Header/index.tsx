import { View, TouchableOpacity, Text } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

type ConnectionState = 'connected' | 'connecting' | 'disconnected';

const getConnectionColor = (state: ConnectionState) =>
  state === 'connected' ? '#22C55E' : state === 'connecting' ? '#F59E0B' : '#EF4444';

const getConnectionLabel = (state: ConnectionState) =>
  state === 'connected' ? '연결됨' : state === 'connecting' ? '연결 중' : '연결 끊김';

interface Props {
  onBack?: () => void;
  headerTitle: string;
  onTitlePress?: () => void;
  onMenuPress?: () => void;
  showMenuButton?: boolean;
  showBackButton?: boolean;
  connectionState?: ConnectionState;
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

  // 색만으로는 상태를 구분하기 어려워 연결되지 않은 동안에는 문구를 함께 보여준다
  const connectionDot = connectionState !== undefined && (
    <View
      testID="header-connection-indicator"
      className="flex-row items-center gap-1"
      accessible
      accessibilityLabel={getConnectionLabel(connectionState)}>
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: getConnectionColor(connectionState) }}
      />
      {connectionState !== 'connected' && (
        <Text className="text-caption text-gray-500">{getConnectionLabel(connectionState)}</Text>
      )}
    </View>
  );

  return (
    <View className="flex-row items-center justify-between px-3 py-6">
      <TouchableOpacity
        onPress={handleBack}
        disabled={!showBackButton}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        accessibilityElementsHidden={!showBackButton}
        importantForAccessibility={showBackButton ? 'auto' : 'no-hide-descendants'}
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
            <Text className="text-center text-body1 text-foreground">{headerTitle}</Text>
            {connectionDot}
          </TouchableOpacity>
        ) : (
          <>
            <Text className="text-center text-body1 text-foreground">{headerTitle}</Text>
            {connectionDot}
          </>
        )}
      </View>
      {showMenuButton ? (
        <TouchableOpacity
          onPress={onMenuPress}
          accessibilityRole="button"
          accessibilityLabel="메뉴 더보기"
          className="w-10 items-center justify-center">
          <Icon name="ellipsis-vertical" size={24} />
        </TouchableOpacity>
      ) : (
        <View className="w-10" />
      )}
    </View>
  );
}
