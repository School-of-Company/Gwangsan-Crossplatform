import { Modal, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Button } from '@/shared/ui/Button';

interface NoNetworkOverlayProps {
  visible: boolean;
}

export function NoNetworkOverlay({ visible }: NoNetworkOverlayProps) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center gap-3 bg-white px-8">
        <Text className="text-center text-titleSmall text-gray-900">
          인터넷에 연결되어 있지 않아요.
        </Text>
        <Text className="mb-6 text-center text-body5 text-gray-500">
          Wi-Fi나 셀룰러 데이터 연결 상태를{'\n'}확인하고 다시 시도해 주세요.
        </Text>
        <Button variant="primary" width="w-32" onPress={() => NetInfo.fetch()}>
          재시도
        </Button>
      </View>
    </Modal>
  );
}
