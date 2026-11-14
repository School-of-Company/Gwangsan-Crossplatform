import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Platform,
  Keyboard,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
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
  canModifyMessage,
} from '~/entity/chat';
import type { EnhancedChatMessage } from '~/entity/chat';
import {
  buildChatListItems,
  DEFAULT_MESSAGE_DISPLAY,
  type ChatListItem,
  type TradeEmbedConfig,
} from '../../lib/buildChatListItems';
import type { MessageAnchor } from '../../model/useMessageActions';
import { useThemeColors } from '~/shared/lib/theme';

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
  readonly onMyMessageLongPress?: (message: EnhancedChatMessage, anchor: MessageAnchor) => void;
  readonly olderMessages?: {
    readonly hasMore: boolean;
    readonly isLoading: boolean;
    readonly load: () => void;
  };
}

// 목록이 inverted라 offset 0이 가장 최근 메시지(화면 맨 아래)다. 이 거리 안에 있으면 "바닥 근처"로 보고
// 새 메시지가 오면 그대로 따라 내려가고, 더 위를 읽는 중이면 위치를 지킨 채 "새 메시지" 버튼을 띄운다
export const NEAR_BOTTOM_THRESHOLD = 120;

// 빈 화면 안내는 콘텐츠 영역 전체 높이 기준으로 가운데 정렬되는데, KeyboardStickyView는
// 입력창만 옮기고 콘텐츠 영역 높이는 줄이지 않는다. 입력창이 닫힘 상태보다 더 올라간 만큼
// (키보드 높이 - 닫힘 상태 오프셋) 하단 여백을 줘서 안내가 남은 공간의 가운데로 오게 한다
export const getEmptyStateBottomInset = (keyboardHeight: number, closedOffset: number): number => {
  'worklet';
  return Math.max(0, -keyboardHeight - closedOffset);
};

const keyExtractor = (item: ChatListItem): string => {
  if (item.type === 'message') return `m-${item.data.messageId}`;
  if (item.type === 'trade') return `t-${item.data.product.id}`;
  if (item.type === 'tradeReserved') return `tr-${item.data.productId}`;
  if (item.type === 'tradeCompleted') return `tc-${item.data.productId}`;
  if (item.type === 'system') return `s-${item.data.messageId}`;
  return `d-${item.timestamp}`;
};

export const ChatRoomContent = memo(function ChatRoomContent({
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
  onMyMessageLongPress,
  olderMessages,
}: ChatRoomContentProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  // KeyboardStickyView(ChatRoomPage)가 닫힘 상태에서 입력창을 띄우는 만큼의 고정 여백
  const closedGap = 10 + (Platform.OS === 'ios' ? insets.bottom : 40);

  // 키보드가 열렸을 때 마지막 말풍선과 입력창 사이 여백
  const openGap = 0;

  // 닫힘 0, 열림 음수(-300 등). 네이티브 키보드 애니메이션과 프레임 단위로 동기화돼 리스트가 키보드와 같이 움직인다
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // closedGap + 스페이서 = 닫힘 시 closedGap, 열림 시 키보드 높이 + openGap
  const keyboardSpacerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, -keyboardHeight.value - closedGap + openGap),
  }));

  // 스페이서가 늘어나는 같은 UI 프레임에서 맨 아래(inverted라 offset 0)로 붙여야 마지막 메시지가 따라 올라간다
  useAnimatedReaction(
    () => keyboardHeight.value,
    (current, previous) => {
      if (current !== previous) {
        scrollTo(flatListRef, 0, 0, false);
      }
    }
  );

  // Fabric에서 scrollTo()가 한 프레임 밀려 리스트가 튀는 문제 우회: 매 프레임 transform이 바뀌는
  // 보이지 않는 뷰로 강제 커밋한다(KeyboardChatScrollView와 같은 방식, reanimated#9000)
  const commitStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value }],
  }));

  const isNearBottomRef = useRef(true);
  const [hasUnseenNewMessage, setHasUnseenNewMessage] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const isNearBottom = event.nativeEvent.contentOffset.y <= NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = isNearBottom;
    if (isNearBottom) setHasUnseenNewMessage(false);
  }, []);

  // 가장 최근 메시지가 바뀌었을 때만 반응한다(수정·읽음 처리 같은 내용 변경은 무시). 위쪽을 읽는
  // 중이면 버튼만 띄우고, 내가 보낸 메시지면 보낸 결과를 볼 수 있게 맨 아래로 내린다
  const newestMessage = messages[messages.length - 1];
  const newestMessageKey = newestMessage ? String(newestMessage.messageId) : null;
  const isNewestMine = Boolean(newestMessage?.isMine);
  const previousNewestKeyRef = useRef(newestMessageKey);
  useEffect(() => {
    const previousKey = previousNewestKeyRef.current;
    previousNewestKeyRef.current = newestMessageKey;
    if (previousKey === null || newestMessageKey === null || previousKey === newestMessageKey) {
      return;
    }
    if (isNewestMine) {
      onScrollToEnd();
      return;
    }
    if (!isNearBottomRef.current) setHasUnseenNewMessage(true);
  }, [newestMessageKey, isNewestMine, onScrollToEnd]);

  const handleNewMessageButtonPress = useCallback(() => {
    setHasUnseenNewMessage(false);
    onScrollToEnd();
  }, [onScrollToEnd]);

  const handleEndReached = useCallback(() => {
    if (olderMessages?.hasMore && !olderMessages.isLoading) olderMessages.load();
  }, [olderMessages]);

  const combinedData = useMemo(
    () => buildChatListItems({ messages, tradeEmbedConfig, showReviewButton, hasReviewedTrade }),
    [messages, tradeEmbedConfig, showReviewButton, hasReviewedTrade]
  );

  const renderItem = useCallback<ListRenderItem<ChatListItem>>(
    ({ item, index }) => {
      if (item.type === 'message') {
        const display = item.display ?? DEFAULT_MESSAGE_DISPLAY;

        if (item.data.isMine) {
          return (
            <MyMessage
              message={item.data}
              isLast={display.isLastMine}
              isFollowedByGrouped={display.isFollowedByGrouped}
              showTime={display.showTime}
              onLongPress={
                onMyMessageLongPress && canModifyMessage(item.data)
                  ? onMyMessageLongPress
                  : undefined
              }
            />
          );
        }

        return (
          <OtherMessage
            message={item.data}
            onProfilePress={onProfilePress}
            showProfile={display.showProfile}
            isFollowedByGrouped={display.isFollowedByGrouped}
            showTime={display.showTime}
          />
        );
      }

      if (item.type === 'dateDivider' || item.type === 'system') {
        return <ChatDateDivider label={item.data.label} />;
      }

      if (item.type === 'tradeReserved') {
        return (
          <TradeReservedEmbed
            alignment={item.data.alignment}
            scheduledAt={item.data.scheduledAt}
            placeName={item.data.placeName}
            reserverNickname={item.data.reserverNickname}
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
    [onProfilePress, onReviewButtonPress, onMyMessageLongPress]
  );

  const emptyStateStyle = useAnimatedStyle(() => ({
    paddingBottom: getEmptyStateBottomInset(keyboardHeight.value, insets.bottom),
  }));

  const hasTradeEmbed = combinedData.some(
    (item) =>
      item.type === 'trade' || item.type === 'tradeReserved' || item.type === 'tradeCompleted'
  );

  if (!hasMessages && !hasTradeEmbed) {
    return (
      <Animated.View testID="chat-empty-state" style={[{ flex: 1 }, emptyStateStyle]}>
        {/* 메시지가 있을 때는 FlatList 기본 동작으로 목록을 누르면 키보드가 내려가지만, 빈 화면 안내는
            일반 View라 눌러도 내려가지 않았다. 목록과 같게 아무 데나 누르면 키보드를 내린다 */}
        <Pressable
          testID="chat-empty-state-dismiss"
          className="flex-1 items-center justify-center px-4"
          onPress={Keyboard.dismiss}
          accessible={false}>
          <Icon name="chatbubbles-outline" size={60} color={colors.muted} />
          <Text className="mt-4 text-center text-gray-500">
            아직 대화가 없습니다.{'\n'}첫 메시지를 보내보세요!
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <>
      {/* inverted라 Header가 화면 맨 아래(입력창 쪽), Footer가 맨 위(가장 오래된 메시지 위)에 그려지고,
          contentContainer의 paddingTop도 화면에서는 아래쪽 여백이 된다 */}
      <FlatList
        ref={flatListRef}
        testID="chat-message-list"
        data={combinedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        inverted
        ListHeaderComponent={<Animated.View style={keyboardSpacerStyle} />}
        ListFooterComponent={
          <>
            {olderMessages?.isLoading && (
              <ActivityIndicator
                testID="chat-older-messages-loading"
                className="py-3"
                color={colors['gray-500']}
              />
            )}
            {renderHeader()}
          </>
        }
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: closedGap }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // 바닥 근처에서 새 메시지가 오면 따라 내려가고, 위쪽을 읽는 중이면 보던 위치를 유지한다
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: NEAR_BOTTOM_THRESHOLD,
        }}
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
      {hasUnseenNewMessage && (
        <View
          pointerEvents="box-none"
          className="absolute inset-x-0 items-center"
          style={{ bottom: closedGap + 8 }}>
          <TouchableOpacity
            testID="chat-new-message-button"
            onPress={handleNewMessageButtonPress}
            accessibilityRole="button"
            accessibilityLabel="새 메시지 보기"
            className="flex-row items-center gap-1 rounded-full bg-gray-900 px-4 py-2 opacity-90">
            <Text className="text-label text-white">새 메시지</Text>
            <Icon name="arrow-down" size={14} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
});
