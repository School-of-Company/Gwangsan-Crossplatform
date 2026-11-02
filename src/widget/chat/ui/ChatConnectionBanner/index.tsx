import { Text, View } from 'react-native';

interface ChatConnectionBannerProps {
  readonly connectionState: 'connected' | 'connecting' | 'disconnected';
}

const CONNECTING_MESSAGE = '채팅 서버에 연결하는 중이에요.';
const DISCONNECTED_MESSAGE = '연결이 끊겼어요. 보낸 메시지는 다시 연결되면 전송돼요.';

// 연결이 끊겨도 입력은 막지 않고(대기열 경유 전송) 이유만 알려준다
export const ChatConnectionBanner = ({ connectionState }: ChatConnectionBannerProps) => {
  if (connectionState === 'connected') return null;

  return (
    <View
      testID="chat-connection-banner"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className="bg-orange-100 px-4 py-2 dark:bg-orange-950">
      <Text className="text-center text-caption text-gray-700">
        {connectionState === 'connecting' ? CONNECTING_MESSAGE : DISCONNECTED_MESSAGE}
      </Text>
    </View>
  );
};
