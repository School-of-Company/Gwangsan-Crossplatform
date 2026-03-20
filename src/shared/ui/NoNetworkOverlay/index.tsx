import { Modal, Text, View } from 'react-native';

interface NoNetworkOverlayProps {
  visible: boolean;
}

export function NoNetworkOverlay({ visible }: NoNetworkOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/60">
        <View className="mx-8 items-center rounded-2xl bg-white px-6 py-8">
          <Text className="mb-2 text-lg font-bold text-gray-900">네트워크 연결 없음</Text>
          <Text className="text-center text-sm text-gray-500">
            인터넷 연결을 확인한 후{'\n'}다시 시도해 주세요.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
