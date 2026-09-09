import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, Platform, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  scrollTo,
  type AnimatedRef,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
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
  readonly hasReviewed: boolean;
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
  readonly flatListRef: AnimatedRef<FlatList<ChatListItem>>;
  readonly renderHeader: () => React.JSX.Element;
  readonly onProfilePress: (userId: number) => void;
  readonly onScrollToEnd: () => void;
  readonly tradeEmbedConfig?: TradeEmbedConfig;
  readonly onReviewButtonPress?: () => void;
  readonly showReviewButton?: boolean;
  readonly hasReviewedTrade?: boolean;
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
  hasReviewedTrade,
}) => {
  const insets = useSafeAreaInsets();

  // KeyboardStickyView(ChatRoomPage)가 입력창을 닫힘 상태에서 이만큼 위로 띄우므로,
  // 그 여백은 항상 정적으로 확보해 둔다(이전 버전의 "10 + basePadding"과 동일한 총량 유지)
  const closedGap = 10 + (Platform.OS === 'ios' ? insets.bottom : 40);

  // 키보드가 완전히 열렸을 때 마지막 말풍선과 입력창 사이에 남기고 싶은 여백(작을수록 붙는다).
  // closedGap과 별도 상수라 닫힘 상태 여백을 안 건드리고 이 값만으로 열림 상태 간격을 조절한다
  const openGap = 0;

  // height는 키보드가 닫혀있으면 0, 열려있으면 음수(예: -300)로, 네이티브 키보드
  // 애니메이션과 프레임 단위로 동기화되는 값이다(KeyboardStickyView가 입력창을 띄울 때
  // 쓰는 것과 동일한 값). 이 값을 그대로 스페이서 높이/스크롤 위치에 반영하면 리스트도
  // 키보드와 같은 속도로 움직인다
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // 정적 패딩(closedGap)에 이 스페이서를 더한 총량이, 닫힘 상태에서는 closedGap 그대로,
  // 열림 상태에서는 keyboardHeight + openGap이 되도록 맞춘다
  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, -keyboardHeight.value - closedGap + openGap),
  }));

  // 스페이서가 늘어나 스크롤 가능 영역이 커지는 동안, 같은 UI 스레드 프레임에서 리스트도
  // 함께 맨 아래로 밀어야 마지막 메시지가 계속 화면에 붙어서 올라간다. scrollToOffset과
  // 마찬가지로 실제 끝보다 훨씬 큰 값으로 스크롤하면 네이티브가 알아서 clamp한다
  useAnimatedReaction(
    () => keyboardHeight.value,
    (current, previous) => {
      if (current !== previous) {
        scrollTo(flatListRef, 0, 10_000_000, false);
      }
    }
  );

  // Fabric에서는 scrollTo()가 같은 프레임에 커밋되지 않고 한 프레임 밀릴 수 있어(키보드
  // 애니메이션이 끝나는 순간 리스트가 툭 튀었다 돌아오는 원인), 매 프레임 transform이
  // 바뀌는 화면에 보이지 않는 뷰를 하나 더 두어 강제로 커밋을 발생시킨다. 이 라이브러리의
  // KeyboardChatScrollView가 쓰는 것과 동일한 우회책이다
  // (see https://github.com/software-mansion/react-native-reanimated/issues/9000)
  const commitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value }],
  }));

  // 스페이서가 애니메이션되는 동안 onContentSizeChange가 프레임마다 발생해, 그때마다 JS
  // 스레드의 별도 애니메이션 스크롤(scrollToEnd(true))이 다시 시작되며 위 scrollTo와 서로
  // 경쟁해 끊기는 느낌을 만든다. reanimated 훅을 더 쓰지 않고, 순수 JS 디바운스로 크기 변화가
  // 잠잠해진 뒤 한 번만 호출되도록 한다
  const scrollToEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentSizeChange = useCallback(() => {
    if (scrollToEndTimeoutRef.current) clearTimeout(scrollToEndTimeoutRef.current);
    scrollToEndTimeoutRef.current = setTimeout(onScrollToEnd, 100);
  }, [onScrollToEnd]);

  useEffect(() => {
    return () => {
      if (scrollToEndTimeoutRef.current) clearTimeout(scrollToEndTimeoutRef.current);
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
            hasReviewed: Boolean(hasReviewedTrade),
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
  }, [messages, tradeEmbedConfig, showReviewButton, hasReviewedTrade]);

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
            hasReviewed={item.data.hasReviewed}
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
    <>
      <FlatList
        ref={flatListRef}
        data={combinedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={{ paddingBottom: closedGap }}
        ListFooterComponent={<Animated.View style={keyboardSpacerStyle} />}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={11}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
      />
      {/* 화면에는 보이지 않지만, 이 뷰의 애니메이션 스타일이 매 프레임 바뀌어야 위 scrollTo가
          같은 프레임에 커밋된다 — NativeWind의 className 경유는 Reanimated의 style prop
          가로채기와 충돌할 수 있어 라이브러리 원본과 동일하게 순수 style 객체를 쓴다 */}
      <Animated.View style={[{ display: 'none', position: 'absolute' }, commitStyle]} />
    </>
  );
};
