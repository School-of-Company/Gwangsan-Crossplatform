import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MyMessage, OtherMessage } from '~/widget/chat';
import type { ChatMessageResponse } from '~/entity/chat';

interface ChatRoomContentProps {
  readonly messages: readonly ChatMessageResponse[];
  readonly hasMessages: boolean;
  readonly flatListRef: React.RefObject<FlatList | null>;
  readonly renderHeader: () => React.JSX.Element;
  readonly onProfilePress: (userId: number) => void;
  readonly onScrollToEnd: () => void;
}

export const ChatRoomContent: React.FC<ChatRoomContentProps> = ({
  messages,
  hasMessages,
  flatListRef,
  renderHeader,
  onProfilePress,
  onScrollToEnd,
}) => {
  const renderMessage = ({ item }: { item: ChatMessageResponse }) => {
    if (item.isMine) {
      return <MyMessage message={item} />;
    } else {
      return <OtherMessage message={item} onProfilePress={onProfilePress} />;
    }
  };

  if (hasMessages) {
    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.messageId.toString()}
        renderItem={renderMessage}
        ListHeaderComponent={renderHeader}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onScrollToEnd}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-4">
      <Icon name="chatbubbles-outline" size={60} color="#D1D5DB" />
      <Text className="mt-4 text-center text-gray-500">
        아직 대화가 없습니다.{'\n'}첫 메시지를 보내보세요!
      </Text>
    </View>
  );
};
