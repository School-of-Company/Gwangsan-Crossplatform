import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePostAction, PostPageContent } from '~/widget/post';
import { ReviewsModal } from '~/entity/post';
import { AlertModal, Header } from '~/shared/ui';
import { ErrorFallback } from '~/shared/ui/ErrorFallback';
import { Spinner } from '~/shared/ui/Spinner';

export default function PostPageView() {
  const { id, review } = useLocalSearchParams<{ id: string; review?: string }>();

  const {
    data,
    isLoading,
    error,
    isMyPost,
    refreshing,
    isDeleting,
    isReviewModalVisible,
    isDeleteAlertVisible,
    reviewLight,
    reviewContents,
    isSubmittingReview,
    isChatLoading,
    isTradeRequestLoading,
    modalHandlers,
    reviewHandlers,
    navigationHandlers,
    actionHandlers,
    computedValues,
  } = usePostAction({ id: id!, review });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Spinner size="large" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Header headerTitle="게시글" />
        <ErrorFallback
          title="게시글을 불러오는데 실패했습니다."
          onRetry={actionHandlers.onRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header headerTitle={computedValues.headerTitle} />

      <PostPageContent
        data={data}
        isMyPost={isMyPost}
        isDeleting={isDeleting}
        isChatLoading={isChatLoading}
        isTradeRequestLoading={isTradeRequestLoading}
        refreshing={refreshing}
        review={review}
        computedValues={computedValues}
        onDeletePress={actionHandlers.onDelete}
        onReportPress={navigationHandlers.goToReport}
        onEditPress={navigationHandlers.goToEdit}
        onChatPress={navigationHandlers.goToChat}
        onTradeRequest={actionHandlers.onTradeRequest}
        onReviewButtonPress={modalHandlers.openReviewModal}
        onRefresh={actionHandlers.onRefresh}
      />

      <ReviewsModal
        isVisible={isReviewModalVisible}
        onClose={modalHandlers.closeReviewModal}
        onSubmit={reviewHandlers.onSubmit}
        light={reviewLight}
        setLight={reviewHandlers.onLightChange}
        contents={reviewContents}
        onContentsChange={reviewHandlers.onContentsChange}
        onAnimationComplete={reviewHandlers.onAnimationComplete}
        isSubmitting={isSubmittingReview}
      />

      <AlertModal
        isVisible={isDeleteAlertVisible}
        message="이 게시글을 삭제하시겠습니까?"
        confirmText="삭제"
        destructive
        isLoading={isDeleting}
        onCancel={modalHandlers.closeDeleteAlert}
        onConfirm={actionHandlers.onConfirmDelete}
      />
    </SafeAreaView>
  );
}
