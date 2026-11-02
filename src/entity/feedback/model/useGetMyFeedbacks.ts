import { useCallback, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getMyFeedbacks, MY_FEEDBACK_PAGE_SIZE } from '../api/getMyFeedbacks';
import { feedbackQueryKeys } from './feedbackQueryKeys';

export const useGetMyFeedbacks = () => {
  const query = useInfiniteQuery({
    queryKey: feedbackQueryKeys.myList(),
    queryFn: ({ pageParam }) => getMyFeedbacks({ lastId: pageParam }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // size보다 적게 오면 마지막 페이지다.
      if (lastPage.length < MY_FEEDBACK_PAGE_SIZE) return undefined;

      const nextCursor = lastPage[lastPage.length - 1]?.feedbackId;
      if (nextCursor == null) return undefined;
      // 커서가 줄어들지 않으면 같은 페이지를 반복 요청하게 되므로 멈춘다.
      if (lastPageParam != null && nextCursor >= lastPageParam) return undefined;

      return nextCursor;
    },
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const feedbacks = useMemo(() => {
    const seen = new Set<number>();
    return (query.data?.pages ?? []).flat().filter((item) => {
      if (seen.has(item.feedbackId)) return false;
      seen.add(item.feedbackId);
      return true;
    });
  }, [query.data]);

  // onEndReached가 리렌더 전에 연달아 불려도 같은 페이지를 두 번 요청하지 않도록 ref로 막는다.
  const isLoadingMoreRef = useRef(false);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    feedbacks,
    isPending: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    loadMore,
    retryNextPage: fetchNextPage,
    refetch: query.refetch,
  };
};
