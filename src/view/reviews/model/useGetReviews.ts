import { useQuery } from '@tanstack/react-query';
import { getMyReceivedReview, getReceiveReview, getTossReview } from '../api/getReviews';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { ReviewPostType } from './reviewPostType';

export type ReviewsMode = 'receive' | 'toss';

export const useGetReviews = (mode: ReviewsMode, memberId?: string) => {
  const { data: myInfo } = useGetMyInformation();
  // 내 프로필에서 온 "받은 후기"는 /review/current, 남의 프로필은 /review/{member_id}
  const isMyReceived = mode === 'receive' && !!myInfo && String(myInfo.memberId) === memberId;

  return useQuery<ReviewPostType[]>({
    queryKey: ['reviews', mode, mode === 'receive' ? (isMyReceived ? 'current' : memberId) : null],
    queryFn: () => {
      if (mode !== 'receive') return getTossReview();
      if (isMyReceived) return getMyReceivedReview();
      if (!memberId) throw new Error('need member ID');
      return getReceiveReview(memberId);
    },
    // 프로필 로딩 전 "undefined" 문자열 id로 이동한 경우 잘못된 요청을 막는다
    // 내 id인지 판별하려면 myInfo가 필요하므로 receive는 myInfo 도착 후 실행
    enabled: mode === 'toss' || (!!memberId && memberId !== 'undefined' && !!myInfo),
  });
};
