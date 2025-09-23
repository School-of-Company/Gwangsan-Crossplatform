import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useChatRoomAction } from '~/widget/chat/model/useChatRoomAction';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { TradeRequestModal } from '@/widget/chat/ui/TradeRequestModal';
import { Header } from '@/shared/ui/Header';
import { ChatInput } from '@/widget/chat';
import type { RoomId } from '@/shared/types/chatType';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;

  const [isTradeRequestModalVisible, setIsTradeRequestModalVisible] = useState(false);

  const {
    flatListRef,
    messages,
    otherUserInfo,
    isLoading,
    isError,
    messageHandlers,
    navigationHandlers,
    tradeEmbedConfig,
    menuConfig,
    tradeRequestInfo,
    formatLastMessageDate,
    scrollToEnd,
    componentState,
  } = useChatRoomAction({ roomId });

  const { handleTradeRequest: executeTradeRequest, isLoading: isTradeRequestLoading } =
    useTradeRequest({
      productId: tradeRequestInfo.productId || 0,
      sellerId: tradeRequestInfo.sellerId || 0,
    });

  const handleMenuPress = useCallback(() => {
    setIsTradeRequestModalVisible(true);
  }, []);

  const handleTradeRequest = useCallback(async () => {
    try {
      await executeTradeRequest();
      setIsTradeRequestModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  }, [executeTradeRequest]);

  const renderHeader = () => (
    <ChatRoomHeader
      otherUserNickname={otherUserInfo.nickname}
      otherUserId={otherUserInfo.id}
      lastMessageDate={formatLastMessageDate()}
      onProfilePress={navigationHandlers.goToOtherUserProfile}
      onMenuPress={handleMenuPress}
      showMenuButton={menuConfig.shouldShowMenuButton}
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
          tradeEmbedConfig={tradeEmbedConfig}
        />

        <ChatInput
          onSendMessage={messageHandlers.sendMessage}
          disabled={!componentState.canSendMessage}
        />
      </KeyboardAvoidingView>

      <TradeRequestModal
        isVisible={isTradeRequestModalVisible}
        onClose={() => setIsTradeRequestModalVisible(false)}
        onTradeRequest={handleTradeRequest}
        isLoading={isTradeRequestLoading}
      />
    </SafeAreaView>
  );
}
