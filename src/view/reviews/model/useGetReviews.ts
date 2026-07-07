import { useQuery } from '@tanstack/react-query';
import { getReceiveReview, getTossReview } from '../api/getReviews';
import { ReviewPostType } from './reviewPostType';

export type ReviewsMode = 'receive' | 'toss';

export const useGetReviews = (mode: ReviewsMode, memberId?: string) =>
  useQuery<ReviewPostType[]>({
    queryKey: ['reviews', mode, mode === 'receive' ? memberId : null],
    queryFn: () => {
      if (mode === 'receive') {
        if (!memberId) throw new Error('need member ID');
        return getReceiveReview(memberId);
      }
      return getTossReview();
    },
    // 프로필 로딩 전 "undefined" 문자열 id로 이동한 경우 잘못된 요청을 막는다
    enabled: mode === 'toss' || (!!memberId && memberId !== 'undefined'),
  });
