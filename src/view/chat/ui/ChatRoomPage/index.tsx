import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { AlertModal } from '@/shared/ui/AlertModal';
import { ChatRoomHeader } from '@/widget/chat/ui/ChatRoomHeader';
import { ChatRoomProductInfo } from '@/widget/chat/ui/ChatRoomProductInfo';
import { ChatRoomContent } from '@/widget/chat/ui/ChatRoomContent';
import { TradeRequestModal } from '@/widget/chat/ui/TradeRequestModal';
import { ReservationConfirmModal } from '@/widget/chat/ui/ReservationConfirmModal';
import { Header } from '@/shared/ui/Header';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { ChatInput, MyMessage } from '@/widget/chat';
import { ChatConnectionBanner } from '@/widget/chat/ui/ChatConnectionBanner';
import { MessageActionOverlay } from '@/widget/chat/ui/MessageActionOverlay';
import { formatDateDividerLabel, formatMessageTime } from '~/entity/chat/lib/messageRenderer';
import { useChatRoomPage } from '~/view/chat/model/useChatRoomPage';

export default function ChatRoomPage() {
  const {
    isValidRoomId,
    insets,
    isTradeRequestModalVisible,
    setIsTradeRequestModalVisible,
    isReservationConfirmVisible,
    setIsReservationConfirmVisible,
    flatListRef,
    otherUserInfo,
    isLoading,
    isError,
    refetchMessages,
    connectionState,
    isBlockedByOtherUser,
    messageHandlers,
    scrollToEnd,
    olderMessages,
    messageActions,
    navigationHandlers,
    formatLastMessageDate,
    myInfo,
    isBlocked,
    unblock,
    visibleMessages,
    isTradeCompleted,
    canManageReservation,
    isReserved,
    productId,
    myTradeReview,
    handleProductPress,
    handleReviewLinkPress,
    handleTradeAccept,
    handleCancelReservation,
    hasTradeRequest,
    canWithdrawTradeRequest,
    isCompletingTrade,
    handleOpenReservationConfirm,
    handleReservationConfirmProceed,
    tradeEmbedConfig,
    menuConfig,
    productInfoConfig,
    updatedComponentState,
    isTradeRequestLoading,
    handleTradeRequestButtonPressed,
    handleTradeRequest,
    handleReviewButtonPress,
  } = useChatRoomPage();

  const renderHeader = () => (
    <ChatRoomHeader
      otherUserNickname={otherUserInfo.nickname}
      otherUserId={otherUserInfo.id}
      lastMessageDate={formatLastMessageDate(visibleMessages)}
      onProfilePress={navigationHandlers.goToOtherUserProfile}
    />
  );

  const renderTradeCompletedInfo = () => (
    <View testID="trade-completed-banner" className="items-end gap-0.5">
      <Text className="shrink-0 text-label text-gray-700" numberOfLines={1}>
        거래 완료
      </Text>
      {myInfo?.memberId != null && (
        <TouchableOpacity testID="received-reviews-link" onPress={handleReviewLinkPress}>
          <Text className="shrink-0 text-caption text-main-500" numberOfLines={1}>
            받은 후기 보기
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const shouldShowTopTradeControl = menuConfig.shouldShowMenuButton && !isTradeCompleted;

  const renderTopTradeControl = () =>
    canManageReservation ? (
      <View className="flex-row items-center gap-2">
        <TouchableOpacity
          testID="trade-seller-button"
          onPress={isReserved ? handleCancelReservation : handleOpenReservationConfirm}
          className={`shrink-0 rounded-lg px-5 py-2.5 ${isReserved ? 'bg-background' : 'bg-main-500'}`}>
          <Text className={`text-label font-medium ${isReserved ? 'text-gray-700' : 'text-white'}`}>
            {isReserved ? '예약 취소' : '예약하기'}
          </Text>
        </TouchableOpacity>
        {isReserved && (
          <TouchableOpacity
            testID="trade-complete-button"
            onPress={handleTradeAccept}
            disabled={isCompletingTrade}
            className={`shrink-0 rounded-lg px-5 py-2.5 ${
              isCompletingTrade ? 'bg-disabled' : 'bg-main-500'
            }`}>
            <Text className="text-label font-medium text-white">거래완료</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : isReserved ? null : (
      <TouchableOpacity
        testID="trade-request-button"
        onPress={handleTradeRequestButtonPressed}
        disabled={hasTradeRequest && !canWithdrawTradeRequest}
        className={`shrink-0 rounded-lg px-5 py-2.5 ${
          hasTradeRequest && !canWithdrawTradeRequest ? 'bg-disabled' : 'bg-main-500'
        }`}>
        <Text
          className={`text-label font-medium ${
            hasTradeRequest && !canWithdrawTradeRequest ? 'text-gray-500' : 'text-white'
          }`}>
          거래요청
        </Text>
      </TouchableOpacity>
    );

  if (!isValidRoomId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">잘못된 채팅방입니다.</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="채팅" />
        <ErrorFallback title="채팅방을 불러오지 못했습니다." onRetry={() => refetchMessages()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle={updatedComponentState.headerTitle} connectionState={connectionState} />
      <ChatConnectionBanner connectionState={connectionState} />

      {(productInfoConfig.shouldShow || isTradeCompleted) && (
        <View className="bg-surface-muted">
          {productInfoConfig.shouldShow ? (
            <ChatRoomProductInfo
              title={productInfoConfig.title}
              gwangsan={productInfoConfig.gwangsan}
              imageUrl={productInfoConfig.imageUrl}
              trailing={
                isTradeCompleted
                  ? renderTradeCompletedInfo()
                  : shouldShowTopTradeControl
                    ? renderTopTradeControl()
                    : undefined
              }
              onPress={productId ? handleProductPress : undefined}
            />
          ) : (
            isTradeCompleted && <View className="px-4 py-3">{renderTradeCompletedInfo()}</View>
          )}
        </View>
      )}

      <ChatRoomContent
        messages={visibleMessages}
        hasMessages={updatedComponentState.hasMessages}
        flatListRef={flatListRef}
        renderHeader={renderHeader}
        onProfilePress={navigationHandlers.goToProfile}
        onScrollToEnd={() => scrollToEnd(true)}
        tradeEmbedConfig={tradeEmbedConfig}
        onReviewButtonPress={handleReviewButtonPress}
        showReviewButton={isTradeCompleted}
        hasReviewedTrade={Boolean(myTradeReview)}
        onMyMessageLongPress={messageActions.openMessageMenu}
        olderMessages={olderMessages}
      />

      <KeyboardStickyView offset={{ closed: -insets.bottom, opened: 0 }}>
        {isBlocked ? (
          <View className="flex-row items-center justify-between border-t border-gray-200 bg-background px-4 py-4">
            <Text className="text-label text-gray-500">차단한 사용자입니다.</Text>
            <TouchableOpacity
              testID="chat-unblock-button"
              onPress={() => unblock.mutate()}
              disabled={unblock.isPending}
              className={`rounded-lg bg-surface-muted px-4 py-2 ${unblock.isPending ? 'opacity-50' : ''}`}>
              <Text className="text-label font-medium text-gray-900">
                {unblock.isPending ? '해제 중...' : '차단 풀기'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : isBlockedByOtherUser ? (
          <View
            testID="chat-blocked-by-other-banner"
            className="border-t border-gray-200 bg-background px-4 py-4">
            <Text className="text-label text-gray-500">
              상대방이 차단하여 메시지를 보낼 수 없습니다.
            </Text>
          </View>
        ) : (
          <ChatInput
            onSendMessage={messageHandlers.sendMessage}
            disabled={!updatedComponentState.canSendMessage}
            onFocus={() => scrollToEnd(true)}
            editingMessage={messageActions.editingMessage}
            onSubmitEdit={messageActions.submitEdit}
            onCancelEdit={messageActions.cancelEdit}
          />
        )}
      </KeyboardStickyView>

      <TradeRequestModal
        isVisible={isTradeRequestModalVisible}
        onClose={() => setIsTradeRequestModalVisible(false)}
        onTradeRequest={handleTradeRequest}
        isLoading={isTradeRequestLoading}
      />

      <ReservationConfirmModal
        isVisible={isReservationConfirmVisible}
        onClose={() => setIsReservationConfirmVisible(false)}
        onConfirm={handleReservationConfirmProceed}
      />

      <MessageActionOverlay
        visible={messageActions.menu !== null}
        anchor={messageActions.menu?.anchor ?? null}
        canEdit={messageActions.menu?.canEdit ?? false}
        timeLabel={
          messageActions.menu
            ? `${formatDateDividerLabel(messageActions.menu.message.createdAt)} ${formatMessageTime(messageActions.menu.message.createdAt)}`
            : undefined
        }
        onEdit={messageActions.selectEdit}
        onDelete={messageActions.selectDelete}
        onClose={messageActions.closeMenu}>
        {messageActions.menu && (
          <MyMessage message={messageActions.menu.message} showTime={false} />
        )}
      </MessageActionOverlay>

      <AlertModal
        isVisible={messageActions.isDeleteConfirmVisible}
        message={'메시지를 삭제할까요?\n상대방 화면에서도 삭제됩니다.'}
        confirmText="삭제"
        destructive
        onCancel={messageActions.cancelDelete}
        onConfirm={messageActions.confirmDelete}
      />
    </SafeAreaView>
  );
}
