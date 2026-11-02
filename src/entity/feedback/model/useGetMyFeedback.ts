import { useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getMyFeedback, type MyFeedbackResponse } from '../api/getMyFeedbacks';
import { feedbackQueryKeys } from './feedbackQueryKeys';

type MyFeedbackPages = InfiniteData<MyFeedbackResponse[], number | null>;

// 회원용 단건 API가 없어 목록 API로 한 건을 조회한다(getMyFeedback 참고). 답변 푸시처럼
// 목록 캐시가 없거나 오래된 경우를 위해 항상 최신 데이터를 받아 목록 캐시에도 반영한다.
export const useGetMyFeedback = (feedbackId: number | undefined) => {
  const queryClient = useQueryClient();

  return useQuery<MyFeedbackResponse | null>({
    queryKey: feedbackQueryKeys.detail(feedbackId ?? 0),
    queryFn: async () => {
      if (!feedbackId) throw new Error('need feedback ID');
      const feedback = await getMyFeedback(feedbackId);

      if (feedback) {
        queryClient.setQueryData<MyFeedbackPages>(feedbackQueryKeys.myList(), (prev) =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map((page) =>
                  page.map((item) => (item.feedbackId === feedbackId ? feedback : item))
                ),
              }
            : prev
        );
      }

      return feedback;
    },
    // 목록 캐시 항목을 초기값으로 쓰고, 화면에 들어올 때마다 다시 받는다. 다시 받기가
    // 실패해도 목록에서 본 내용은 그대로 보인다.
    initialData: () => {
      if (!feedbackId) return undefined;
      const list = queryClient.getQueryData<MyFeedbackPages>(feedbackQueryKeys.myList());
      return list?.pages.flat().find((item) => item.feedbackId === feedbackId);
    },
    initialDataUpdatedAt: 0,
    staleTime: 0,
    enabled: !!feedbackId,
  });
};
