import { Text, TouchableOpacity, View } from 'react-native';
import type { MyFeedbackResponse } from '../../api/getMyFeedbacks';
import { FEEDBACK_TYPE_MAP } from '../../model/feedbackType';
import { formatFeedbackDate } from '../../model/formatFeedbackDate';
import { FeedbackStatusBadge } from '../FeedbackStatusBadge';

interface FeedbackCardProps {
  feedback: MyFeedbackResponse;
  onPress: (feedbackId: number) => void;
}

export const FeedbackCard = ({ feedback, onPress }: FeedbackCardProps) => {
  const { feedbackId, content, status, createdAt } = feedback;

  return (
    <TouchableOpacity
      testID={`feedback-card-${feedbackId}`}
      activeOpacity={0.7}
      onPress={() => onPress(feedbackId)}
      className="gap-2 rounded-2xl bg-gray-50 px-5 py-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-label text-gray-700">
          {FEEDBACK_TYPE_MAP[feedback.type] ?? feedback.type}
        </Text>
        <FeedbackStatusBadge status={status} />
      </View>
      <Text className="text-body4 text-foreground" numberOfLines={2} ellipsizeMode="tail">
        {content}
      </Text>
      <Text className="text-caption text-gray-500">{formatFeedbackDate(createdAt)}</Text>
    </TouchableOpacity>
  );
};
