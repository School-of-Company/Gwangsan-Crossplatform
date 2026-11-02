import { Text, View } from 'react-native';
import type { FeedbackStatus } from '../../api/getMyFeedbacks';
import { getFeedbackStatusLabel } from '../../model/feedbackStatus';

const getStatusClass = (status: FeedbackStatus) => {
  switch (status) {
    case 'IN_PROGRESS':
      return { container: 'bg-sub2-100', text: 'text-sub2-700' };
    case 'DONE':
      return { container: 'bg-main-100', text: 'text-main-700' };
    default:
      return { container: 'bg-gray-100', text: 'text-gray-700' };
  }
};

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus;
}

export const FeedbackStatusBadge = ({ status }: FeedbackStatusBadgeProps) => {
  const style = getStatusClass(status);
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.container}`}>
      <Text className={`text-caption font-medium ${style.text}`}>
        {getFeedbackStatusLabel(status)}
      </Text>
    </View>
  );
};
