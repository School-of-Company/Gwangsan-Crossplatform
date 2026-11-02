import type { FeedbackStatus } from '../api/getMyFeedbacks';

export const getFeedbackStatusLabel = (status: FeedbackStatus): string => {
  switch (status) {
    case 'RECEIVED':
      return '접수';
    case 'IN_PROGRESS':
      return '처리중';
    case 'DONE':
      return '완료';
    default:
      return status;
  }
};
