import { FlatList, View, Text } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import { ChatMessage } from '@/entity/chat/ui/ChatMessage';
import type { ChatMessageResponse } from '@/entity/chat';

interface ChatMessageListProps {
  messages: ChatMessageResponse[];
  isLoading?: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessageResponse }) => <ChatMessage message={item} />,
    []
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-base text-gray-500">대화를 시작해보세요</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">메시지를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.messageId.toString()}
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      className="flex-1 px-4"
      contentContainerStyle={{ paddingVertical: 16 }}
    />
  );
}
