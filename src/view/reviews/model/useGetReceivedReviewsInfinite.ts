import { useInfiniteQuery } from '@tanstack/react-query';
import { getMyReceivedReview, getReceiveReview } from '../api/getReviews';
import { useGetMyInformation } from '~/entity/main/model/useGetMyInformation';
import { ReviewPostType } from './reviewPostType';

export const RECEIVED_REVIEWS_PAGE_SIZE = 20;

// 판매 목록(SellingPage)에서 쓰는 전체 받은 후기 쿼리(useGetReviews)와 캐시가 섞이면
// 배열 응답과 { pages, pageParams } 응답 모양이 달라 그 화면이 깨진다. 그래서 이 훅은
// 별도의 쿼리키('infinite' 분리)와 별도의 캐시 경로를 사용한다.
export const useGetReceivedReviewsInfinite = (memberId?: string, enabled = true) => {
  const { data: myInfo } = useGetMyInformation();
  const isMyReceived = !!myInfo && String(myInfo.memberId) === memberId;

  return useInfiniteQuery({
    queryKey: [
      'reviews',
      'receive',
      'infinite',
      isMyReceived ? 'current' : memberId,
      RECEIVED_REVIEWS_PAGE_SIZE,
    ],
    queryFn: ({ pageParam }: { pageParam?: number }) => {
      const params = {
        size: RECEIVED_REVIEWS_PAGE_SIZE,
        ...(pageParam !== undefined ? { cursor: pageParam } : {}),
      };
      if (isMyReceived) return getMyReceivedReview(params);
      if (!memberId) throw new Error('need member ID');
      return getReceiveReview(memberId, params);
    },
    initialPageParam: undefined as number | undefined,
    // length < size 또는 빈 배열이면 종료. 정확히 size개이면 다음 페이지가 빈 배열로
    // 올 수도 있으므로(요청 자체는 계속 허용) 마지막 항목의 reviewId를 다음 cursor로 넘긴다.
    getNextPageParam: (lastPage: ReviewPostType[]): number | undefined => {
      if (lastPage.length < RECEIVED_REVIEWS_PAGE_SIZE) return undefined;
      const lastReview = lastPage[lastPage.length - 1];
      return lastReview ? Number(lastReview.reviewId) : undefined;
    },
    // 프로필 로딩 전 "undefined" 문자열 id로 이동한 경우를 막고, 내 id인지 판별하는
    // myInfo가 도착한 뒤에만 실행한다. 화면에서 비활성 탭일 때는 enabled로 끌 수 있다.
    enabled: enabled && !!memberId && memberId !== 'undefined' && !!myInfo,
  });
};
