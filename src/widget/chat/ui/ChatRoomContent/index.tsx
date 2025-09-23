import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MyMessage, OtherMessage } from '~/widget/chat';
import { TradeEmbed } from '~/entity/chat';
import type { ChatMessageResponse, TradeProduct } from '~/entity/chat';

interface ChatRoomContentProps {
  readonly messages: readonly ChatMessageResponse[];
  readonly hasMessages: boolean;
  readonly flatListRef: React.RefObject<FlatList | null>;
  readonly renderHeader: () => React.JSX.Element;
  readonly onProfilePress: (userId: number) => void;
  readonly onScrollToEnd: () => void;
  readonly tradeEmbedConfig?: {
    readonly shouldShow: boolean;
    readonly product?: TradeProduct | null;
    readonly onTradeAccept?: () => Promise<void>;
    readonly onReservation?: () => void;
    readonly onCancelReservation?: () => void;
    readonly showButtons: boolean;
    readonly isLoading: boolean;
    readonly requestorNickname: string;
  };
}

export const ChatRoomContent: React.FC<ChatRoomContentProps> = ({
  messages,
  hasMessages,
  flatListRef,
  renderHeader,
  onProfilePress,
  onScrollToEnd,
  tradeEmbedConfig,
}) => {
  const getCombinedData = () => {
    const combinedData: { type: 'message' | 'trade'; data: any; timestamp: string }[] = [];

    messages.forEach((message) => {
      combinedData.push({
        type: 'message',
        data: message,
        timestamp: message.createdAt,
      });
    });

    if (tradeEmbedConfig?.shouldShow && tradeEmbedConfig.product?.createdAt) {
      combinedData.push({
        type: 'trade',
        data: tradeEmbedConfig,
        timestamp: tradeEmbedConfig.product.createdAt,
      });
    }

    return combinedData.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const renderItem = ({ item }: { item: { type: 'message' | 'trade'; data: any } }) => {
    if (item.type === 'message') {
      const message = item.data as ChatMessageResponse;
      if (message.isMine) {
        return <MyMessage message={message} />;
      } else {
        return <OtherMessage message={message} onProfilePress={onProfilePress} />;
      }
    } else if (item.type === 'trade') {
      const config = item.data;
      return (
        <TradeEmbed
          product={config.product}
          onTradeAccept={config.onTradeAccept}
          onReservation={config.onReservation}
          onCancelReservation={config.onCancelReservation}
          showButtons={config.showButtons}
          isLoading={config.isLoading}
          requestorNickname={config.requestorNickname}
          alignment={config.showButtons ? 'left' : 'right'}
        />
      );
    }
    return null;
  };

  const combinedData = getCombinedData();

  if (hasMessages || (tradeEmbedConfig?.shouldShow && tradeEmbedConfig.product)) {
    return (
      <FlatList
        ref={flatListRef}
        data={combinedData}
        keyExtractor={(item, index) =>
          item.type === 'message' ? item.data.messageId.toString() : `trade-${index}`
        }
        renderItem={renderItem}
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
