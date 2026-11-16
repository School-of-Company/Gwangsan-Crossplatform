import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CachedImage, Header } from '~/shared/ui';
import { isValidId } from '~/shared/lib/validateId';
import {
  FEEDBACK_TYPE_MAP,
  FeedbackStatusBadge,
  formatFeedbackDate,
  useGetMyFeedback,
} from '~/entity/feedback';
import { LoadingView } from '~/shared/ui/LoadingView';

const HEADER_TITLE = '문의 상세';

const Message = ({ text, className = 'text-gray-500' }: { text: string; className?: string }) => (
  <View className="flex-1 items-center justify-center px-6">
    <Text className={`text-center ${className}`}>{text}</Text>
  </View>
);

export default function FeedbackDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const feedbackId = isValidId(id) ? Number(id) : undefined;
  const {
    data: feedback,
    isPending,
    isError,
    isRefetching,
    refetch,
  } = useGetMyFeedback(feedbackId);

  const renderBody = () => {
    if (!feedbackId) return <Message text="문의를 찾을 수 없습니다." />;
    if (isPending) {
      return <LoadingView testID="feedback-detail-loading" size="large" />;
    }
    if (!feedback) {
      return isError ? (
        <Message text="문의를 불러오지 못했습니다." className="text-error-500" />
      ) : (
        <Message text="문의를 찾을 수 없습니다." />
      );
    }

    const hasImages = feedback.images.length > 0;
    const hasAnswer = !!feedback.answer;

    return (
      <ScrollView
        testID="feedback-detail"
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-body3 text-foreground">
              {FEEDBACK_TYPE_MAP[feedback.type] ?? feedback.type}
            </Text>
            <FeedbackStatusBadge status={feedback.status} />
          </View>
          <Text className="text-caption text-gray-500">
            {formatFeedbackDate(feedback.createdAt, true)}
          </Text>
          <Text className="text-body4 leading-6 text-foreground">{feedback.content}</Text>
        </View>

        {hasImages && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {feedback.images.map((image) => (
                <CachedImage
                  key={image.imageId}
                  testID={`feedback-image-${image.imageId}`}
                  source={{ uri: image.imageUrl }}
                  className="h-28 w-28 rounded-xl"
                />
              ))}
            </View>
          </ScrollView>
        )}

        <View className="gap-2 rounded-2xl bg-gray-50 px-5 py-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-label text-gray-700">관리자 답변</Text>
            {hasAnswer && (
              <Text className="text-caption text-gray-500">
                {formatFeedbackDate(feedback.answeredAt, true)}
              </Text>
            )}
          </View>
          <Text
            className={`text-body4 leading-6 ${hasAnswer ? 'text-foreground' : 'text-gray-500'}`}>
            {hasAnswer ? feedback.answer : '아직 답변이 등록되지 않았습니다.'}
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <Header headerTitle={HEADER_TITLE} />
      {renderBody()}
    </SafeAreaView>
  );
}
