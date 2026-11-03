import { useQuery } from '@tanstack/react-query';
import { getMyReceivedReview, getReceiveReview, getTossReview } from '../api/getReviews';
import { ReviewPostType } from './reviewPostType';
import { reviewKeys } from './reviewQueryKeys';

export type ReviewsMode = 'receive' | 'toss';

interface UseGetReviewsOptions {
  // 화면에서 현재 보이지 않는 탭까지 함께 조회하지 않도록 바깥에서 끌 수 있게 한다.
  enabled?: boolean;
  // 받은 후기에서 내 목록(/review/current)인지 판별할 내 memberId. 아직 모르면 undefined로 두면 조회를 미룬다.
  myMemberId?: number;
}

export const useGetReviews = (
  mode: ReviewsMode,
  memberId?: string,
  options?: UseGetReviewsOptions
) => {
  const myMemberId = options?.myMemberId;
  // 내 프로필에서 온 "받은 후기"는 /review/current, 남의 프로필은 /review/{member_id}
  const isMyReceived =
    mode === 'receive' && myMemberId !== undefined && String(myMemberId) === memberId;

  return useQuery<ReviewPostType[]>({
    queryKey:
      mode === 'toss'
        ? reviewKeys.toss()
        : reviewKeys.received(isMyReceived ? 'current' : memberId),
    queryFn: () => {
      if (mode !== 'receive') return getTossReview();
      if (isMyReceived) return getMyReceivedReview();
      if (!memberId) throw new Error('need member ID');
      return getReceiveReview(memberId);
    },
    // 프로필 로딩 전 "undefined" 문자열 id로 이동한 경우 잘못된 요청을 막는다
    // 내 id인지 판별하려면 myMemberId가 필요하므로 receive는 그 값이 들어온 뒤 실행
    enabled:
      (options?.enabled ?? true) &&
      (mode === 'toss' || (!!memberId && memberId !== 'undefined' && myMemberId !== undefined)),
  });
};
