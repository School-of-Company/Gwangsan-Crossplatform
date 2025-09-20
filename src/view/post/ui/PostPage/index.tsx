import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePostAction } from '@/widget/post/model/usePostAction';
import { PostPageContent } from '@/widget/post/ui/PostPageContent';
import ReportModal from '~/entity/post/ui/ReportModal';
import ReviewsModal from '~/entity/post/ui/ReviewsModal';
import { Header } from '~/shared/ui';

export default function PostPageView() {
  const { id, review } = useLocalSearchParams<{ id: string; review?: string }>();
  
  const {
    data,
    isLoading,
    error,
    isMyPost,
    refreshing,
    isDeleting,
    isReportModalVisible,
    isReviewModalVisible,
    reviewLight,
    reviewContents,
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
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#8FC31D" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-error-500">게시글을 불러오는데 실패했습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
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
        onReportPress={modalHandlers.openReportModal}
        onEditPress={navigationHandlers.goToEdit}
        onChatPress={navigationHandlers.goToChat}
        onTradeRequest={actionHandlers.onTradeRequest}
        onReviewButtonPress={modalHandlers.openReviewModal}
        onRefresh={actionHandlers.onRefresh}
      />

      <ReportModal
        productId={data?.id || 0}
        memberId={data?.member.memberId}
        isVisible={isReportModalVisible}
        onClose={modalHandlers.closeReportModal}
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
      />
    </SafeAreaView>
  );
}
