import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, type ListRenderItem } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MyMessage, OtherMessage } from '~/widget/chat';
import { TradeEmbed } from '~/entity/chat';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

interface TradeEmbedConfig {
  readonly shouldShow: boolean;
  readonly product?: TradeProduct | null;
  readonly onTradeAccept?: () => Promise<void>;
  readonly onReservation?: () => void;
  readonly onCancelReservation?: () => void;
  readonly showButtons: boolean;
  readonly isLoading: boolean;
  readonly requestorNickname: string;
}

type ResolvedTradeEmbed = Omit<TradeEmbedConfig, 'product'> & {
  readonly product: TradeProduct;
};

type ChatListItem =
  | { readonly type: 'message'; readonly timestamp: string; readonly data: EnhancedChatMessage }
  | { readonly type: 'trade'; readonly timestamp: string; readonly data: ResolvedTradeEmbed };

interface ChatRoomContentProps {
  readonly messages: readonly EnhancedChatMessage[];
  readonly hasMessages: boolean;
  readonly flatListRef: React.RefObject<FlatList<ChatListItem> | null>;
  readonly renderHeader: () => React.JSX.Element;
  readonly onProfilePress: (userId: number) => void;
  readonly onScrollToEnd: () => void;
  readonly tradeEmbedConfig?: TradeEmbedConfig;
  readonly onReviewButtonPress?: () => void;
  readonly showReviewButton?: boolean;
}

const keyExtractor = (item: ChatListItem): string =>
  item.type === 'message' ? `m-${item.data.messageId}` : `t-${item.data.product.id}`;

export const ChatRoomContent: React.FC<ChatRoomContentProps> = ({
  messages,
  hasMessages,
  flatListRef,
  renderHeader,
  onProfilePress,
  onScrollToEnd,
  tradeEmbedConfig,
  onReviewButtonPress,
  showReviewButton,
}) => {
  const combinedData = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = messages.map((message) => ({
      type: 'message',
      timestamp: message.createdAt,
      data: message,
    }));

    if (!tradeEmbedConfig?.shouldShow || !tradeEmbedConfig.product?.createdAt) {
      return items;
    }

    const tradeTimestamp = tradeEmbedConfig.product.createdAt;
    const tradeTime = new Date(tradeTimestamp).getTime();
    const tradeItem: ChatListItem = {
      type: 'trade',
      timestamp: tradeTimestamp,
      data: tradeEmbedConfig as ResolvedTradeEmbed,
    };

    const insertAt = items.findIndex((item) => new Date(item.timestamp).getTime() > tradeTime);
    if (insertAt < 0) {
      items.push(tradeItem);
    } else {
      items.splice(insertAt, 0, tradeItem);
    }
    return items;
  }, [messages, tradeEmbedConfig]);

  const renderItem = useCallback<ListRenderItem<ChatListItem>>(
    ({ item }) => {
      if (item.type === 'message') {
        return item.data.isMine ? (
          <MyMessage message={item.data} />
        ) : (
          <OtherMessage message={item.data} onProfilePress={onProfilePress} />
        );
      }

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
          onReviewButtonPress={onReviewButtonPress}
          showReviewButton={showReviewButton}
        />
      );
    },
    [onProfilePress, onReviewButtonPress, showReviewButton]
  );

  const hasTradeEmbed = Boolean(tradeEmbedConfig?.shouldShow && tradeEmbedConfig.product);

  if (!hasMessages && !hasTradeEmbed) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Icon name="chatbubbles-outline" size={60} color="#D1D5DB" />
        <Text className="mt-4 text-center text-gray-500">
          아직 대화가 없습니다.{'\n'}첫 메시지를 보내보세요!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={combinedData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      className="flex-1 px-4"
      showsVerticalScrollIndicator={false}
      onContentSizeChange={onScrollToEnd}
      contentContainerStyle={{ paddingBottom: 10 }}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={11}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
    />
  );
};
