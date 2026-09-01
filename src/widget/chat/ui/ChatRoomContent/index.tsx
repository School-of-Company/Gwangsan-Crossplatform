import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Keyboard, Platform, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { MyMessage } from '../MyMessage';
import { OtherMessage } from '../OtherMessage';
import { ChatDateDivider } from '../ChatDateDivider';
import {
  TradeEmbed,
  TradeCompletedEmbed,
  TradeReservedEmbed,
  formatMessageTime,
  getMessageDateKey,
  formatDateDividerLabel,
} from '~/entity/chat';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

interface TradeEmbedConfig {
  readonly shouldShow: boolean;
  readonly product?: TradeProduct | null;
  readonly showButtons: boolean;
  readonly otherPartyNickname: string;
  readonly onOpenReservationModal?: () => void;
  readonly onOpenMap?: () => void;
}

type ResolvedTradeEmbed = Omit<TradeEmbedConfig, 'product'> & {
  readonly product: TradeProduct;
};

interface ResolvedTradeCompletedEmbed {
  readonly productId: number;
  readonly alignment: 'left' | 'right';
}

interface ResolvedTradeReservedEmbed {
  readonly productId: number;
  readonly alignment: 'left' | 'right';
  readonly scheduledAt?: string | null;
  readonly placeName?: string | null;
  readonly otherPartyNickname: string;
  readonly onOpenMap?: () => void;
}

type ChatListItem =
  | { readonly type: 'message'; readonly timestamp: string; readonly data: EnhancedChatMessage }
  | { readonly type: 'trade'; readonly timestamp: string; readonly data: ResolvedTradeEmbed }
  | {
      readonly type: 'tradeReserved';
      readonly timestamp: string;
      readonly data: ResolvedTradeReservedEmbed;
    }
  | {
      readonly type: 'tradeCompleted';
      readonly timestamp: string;
      readonly data: ResolvedTradeCompletedEmbed;
    }
  | {
      readonly type: 'dateDivider';
      readonly timestamp: string;
      readonly data: { readonly label: string };
    };

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

const keyExtractor = (item: ChatListItem): string => {
  if (item.type === 'message') return `m-${item.data.messageId}`;
  if (item.type === 'trade') return `t-${item.data.product.id}`;
  if (item.type === 'tradeReserved') return `tr-${item.data.productId}`;
  if (item.type === 'tradeCompleted') return `tc-${item.data.productId}`;
  return `d-${item.timestamp}`;
};

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const lastMyMessageId = useMemo(() => {
    const lastMyMessage = [...messages].reverse().find((message) => message.isMine);
    return lastMyMessage?.messageId ?? null;
  }, [messages]);

  const combinedData = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = messages.map((message) => ({
      type: 'message',
      timestamp: message.createdAt,
      data: message,
    }));

    const product = tradeEmbedConfig?.product;
    if (tradeEmbedConfig?.shouldShow && product?.createdAt) {
      const tradeTimestamp = product.createdAt;
      const tradeItem: ChatListItem = {
        type: 'trade',
        timestamp: tradeTimestamp,
        // 요청/수신 방향(왼쪽·오른쪽, 문구)은 언제든 false로 뒤집힐 수 있는 isCompletable이 아니라
        // 완료 후에도 값이 그대로인 isSeller로 고정해야, 거래가 완료돼도 기존 카드가 반대편으로
        // 뒤집히지 않는다
        data: { ...tradeEmbedConfig, showButtons: product.isSeller } as ResolvedTradeEmbed,
      };

      // WS 메시지는 UTC(Z 접미사), REST 메시지는 로컬 오프셋 없는 문자열이라 raw string 비교로는
      // 정렬 순서가 뒤집힐 수 있다 — items 정렬(useChatMessages.ts)과 동일하게 epoch 기준으로 비교한다
      const tradeMs = new Date(tradeTimestamp).getTime();
      const insertAt = Number.isNaN(tradeMs)
        ? -1
        : items.findIndex((item) => {
            const itemMs = new Date(item.timestamp).getTime();
            return !Number.isNaN(itemMs) && itemMs > tradeMs;
          });
      items.splice(insertAt < 0 ? items.length : insertAt, 0, tradeItem);

      // 서버가 예약/완료 시점을 별도로 내려주지 않아 실제 타임스탬프로 끼워 넣을 수 없다 —
      // 두 시점 모두 항상 지금까지의 대화 중 가장 최근이므로 목록 맨 끝에 추가하고,
      // 기존 거래요청 카드는 그대로 둔다
      const appendTrailingTimestamp = () => {
        const lastItem = items[items.length - 1];
        const lastMs = lastItem ? new Date(lastItem.timestamp).getTime() : NaN;
        return Number.isNaN(lastMs) ? tradeTimestamp : new Date(lastMs + 1).toISOString();
      };

      if (!product.isCompleted && product.isReserved) {
        items.push({
          type: 'tradeReserved',
          timestamp: appendTrailingTimestamp(),
          data: {
            productId: product.id,
            alignment: product.isSeller ? 'left' : 'right',
            scheduledAt: product.reservationScheduledAt,
            placeName: product.reservationPlaceName,
            otherPartyNickname: tradeEmbedConfig.otherPartyNickname,
            onOpenMap: tradeEmbedConfig.onOpenMap,
          },
        });
      }

      if (showReviewButton && product.isCompleted) {
        items.push({
          type: 'tradeCompleted',
          timestamp: appendTrailingTimestamp(),
          data: {
            productId: product.id,
            alignment: product.isSeller ? 'left' : 'right',
          },
        });
      }
    }

    // 날짜가 바뀌는 경계마다 구분선을 끼워 넣는다 — 이전 날짜 문구는 그대로 두고, 새 날짜는 그 아래에 추가된다
    const itemsWithDateDividers: ChatListItem[] = [];
    let lastDateKey: string | null = null;

    items.forEach((item) => {
      const dateKey = getMessageDateKey(item.timestamp);
      if (dateKey !== lastDateKey) {
        itemsWithDateDividers.push({
          type: 'dateDivider',
          timestamp: item.timestamp,
          data: { label: formatDateDividerLabel(item.timestamp) },
        });
        lastDateKey = dateKey;
      }
      itemsWithDateDividers.push(item);
    });

    return itemsWithDateDividers;
  }, [messages, tradeEmbedConfig, showReviewButton]);

  const renderItem = useCallback<ListRenderItem<ChatListItem>>(
    ({ item, index }) => {
      if (item.type === 'message') {
        const previousItem = combinedData[index - 1];
        const nextItem = combinedData[index + 1];

        // 다음 메시지와 시간(분 단위)이 같으면 현재 메시지의 시간 표시는 숨기고 아래쪽에만 노출한다
        const hasSameTimeAsNext =
          nextItem?.type === 'message' &&
          formatMessageTime(nextItem.data.createdAt) === formatMessageTime(item.data.createdAt);

        if (item.data.isMine) {
          // 다음 메시지도 내가 연달아 보낸 것이면, '나와 다음 메시지 사이' 간격을 좁힌다
          const isFollowedByGrouped = nextItem?.type === 'message' && nextItem.data.isMine;
          return (
            <MyMessage
              message={item.data}
              isLast={item.data.messageId === lastMyMessageId}
              isFollowedByGrouped={isFollowedByGrouped}
              showTime={!(isFollowedByGrouped && hasSameTimeAsNext)}
            />
          );
        }

        const isSameSenderContinuation = (candidate: ChatListItem | undefined) =>
          candidate?.type === 'message' &&
          !candidate.data.isMine &&
          candidate.data.senderId === item.data.senderId;

        // 프로필/닉네임 노출 여부는 '이전' 메시지 기준, 간격은 '다음' 메시지 기준으로 판단한다
        const isGrouped = isSameSenderContinuation(previousItem);
        const isFollowedByGrouped = isSameSenderContinuation(nextItem);

        return (
          <OtherMessage
            message={item.data}
            onProfilePress={onProfilePress}
            showProfile={!isGrouped}
            isFollowedByGrouped={isFollowedByGrouped}
            showTime={!(isFollowedByGrouped && hasSameTimeAsNext)}
          />
        );
      }

      if (item.type === 'dateDivider') {
        return <ChatDateDivider label={item.data.label} />;
      }

      if (item.type === 'tradeReserved') {
        return (
          <TradeReservedEmbed
            alignment={item.data.alignment}
            scheduledAt={item.data.scheduledAt}
            placeName={item.data.placeName}
            otherPartyNickname={item.data.otherPartyNickname}
            onOpenMap={item.data.onOpenMap}
          />
        );
      }

      if (item.type === 'tradeCompleted') {
        return (
          <TradeCompletedEmbed
            alignment={item.data.alignment}
            onReviewButtonPress={onReviewButtonPress}
          />
        );
      }

      const config = item.data;
      return (
        <TradeEmbed
          product={config.product}
          showButtons={config.showButtons}
          otherPartyNickname={config.otherPartyNickname}
          alignment={config.showButtons ? 'left' : 'right'}
          onOpenReservationModal={config.onOpenReservationModal}
        />
      );
    },
    [onProfilePress, onReviewButtonPress, lastMyMessageId, combinedData]
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
      contentContainerStyle={{
        // KeyboardStickyView(ChatRoomPage)가 입력창을 닫힘 상태에서 insets.bottom(iOS)/15(Android)만큼
        // 위로 띄우므로, 그만큼 리스트 하단 여백을 확보해야 마지막 메시지가 가려지지 않음
        paddingBottom: 10 + (Platform.OS === 'ios' ? Math.max(keyboardHeight, insets.bottom) : 15),
      }}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={11}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
    />
  );
};
