import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useEffect, useCallback, useRef } from 'react';
import { Header } from '@/shared/ui/Header';
import { useChatMessages } from '@/entity/chat';
import { useChatSocket } from '@/entity/chat/model/useChatSocket';
import Icon from 'react-native-vector-icons/Ionicons';
import type { RoomId } from '@/shared/types/chatType';
import type { ChatMessageResponse } from '@/entity/chat';
import { MyMessage, OtherMessage, ChatInput } from '@/widget/chat';

export default function ChatRoomPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id) as RoomId;
  const flatListRef = useRef<FlatList>(null);

  const { data: messages, isLoading, isError } = useChatMessages(roomId);
  const { sendMessage, markRoomAsRead, connectionState } = useChatSocket({
    currentRoomId: roomId,
  });

  useEffect(() => {
    if (roomId) {
      markRoomAsRead(roomId);
    }
  }, [roomId, markRoomAsRead]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendTextMessage = useCallback(
    (textMessage: string) => {
      if (connectionState === 'connected') {
        sendMessage(roomId, textMessage, 'TEXT');
      }
    },
    [roomId, sendMessage, connectionState]
  );

  const handleSendImageMessage = useCallback(
    (imageIds: number[], imageInfos?: Array<{ imageId: number; imageUrl: string }>) => {
      if (connectionState === 'connected') {
        sendMessage(roomId, null, 'IMAGE', imageIds);
      }
    },
    [roomId, sendMessage, connectionState]
  );

  const otherUserNickname = messages?.find((msg) => !msg.isMine)?.senderNickname || '상대방';

  const renderMessage = useCallback(({ item }: { item: ChatMessageResponse }) => {
    console.log('Rendering message:', {
      messageId: item.messageId,
      isMine: item.isMine,
      senderNickname: item.senderNickname,
      senderId: item.senderId,
      content: item.content,
    });

    if (item.isMine) {
      return <MyMessage message={item} />;
    } else {
      return <OtherMessage message={item} />;
    }
  }, []);

  const renderHeader = useCallback(() => {
    return (
      <View className="items-center bg-white py-8">
        <Text className="mb-2 text-xl font-bold text-gray-900">{otherUserNickname}</Text>
        <Text className="text-sm text-gray-500">
          {messages && messages.length > 0
            ? new Date(messages[messages.length - 1].createdAt).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
            : '대화를 시작해보세요'}
        </Text>
      </View>
    );
  }, [otherUserNickname, messages]);

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
      <Header headerTitle={otherUserNickname} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        {messages && messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.messageId.toString()}
            renderItem={renderMessage}
            ListHeaderComponent={renderHeader}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Icon name="chatbubbles-outline" size={60} color="#D1D5DB" />
            <Text className="mt-4 text-center text-gray-500">
              아직 대화가 없습니다.{'\n'}첫 메시지를 보내보세요!
            </Text>
          </View>
        )}

        <ChatInput
          onSendTextMessage={handleSendTextMessage}
          onSendImageMessage={handleSendImageMessage}
          disabled={connectionState !== 'connected'}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
