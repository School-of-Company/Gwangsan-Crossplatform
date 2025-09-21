import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useChatRoomAction } from '~/widget/chat/model/useChatRoomAction';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { Header } from '@/shared/ui/Header';
import { ChatInput } from '@/widget/chat';
import type { RoomId } from '@/shared/types/chatType';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;

  const {
    flatListRef,
    messages,
    otherUserInfo,
    isLoading,
    isError,
    messageHandlers,
    navigationHandlers,
    tradeEmbedConfig,
    formatLastMessageDate,
    scrollToEnd,
    componentState,
  } = useChatRoomAction({ roomId });

  const renderHeader = () => (
    <ChatRoomHeader
      otherUserNickname={otherUserInfo.nickname}
      otherUserId={otherUserInfo.id}
      lastMessageDate={formatLastMessageDate()}
      tradeEmbedConfig={tradeEmbedConfig}
      onProfilePress={navigationHandlers.goToOtherUserProfile}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">Failed to load chat room</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header headerTitle={componentState.headerTitle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        <ChatRoomContent
          messages={messages}
          hasMessages={componentState.hasMessages}
          flatListRef={flatListRef}
          renderHeader={renderHeader}
          onProfilePress={navigationHandlers.goToProfile}
          onScrollToEnd={() => scrollToEnd(true)}
        />

        <ChatInput
          onSendMessage={messageHandlers.sendMessage}
          disabled={!componentState.canSendMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
