import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef } from 'react';
import { MODE } from '~/shared/types/mode';
import type { PostType } from '~/shared/types/postType';
import type { ProductType } from '~/shared/types/type';
import { getSellingPosts, SELLING_PAGE_SIZE } from '../api/getSellingPosts';
import { sellingPostsQueryKeys } from './sellingPostsQueryKeys';

interface UseGetSellingPostsParams {
  memberId?: string;
  completed?: boolean;
  type?: ProductType;
  size?: number;
  enabled?: boolean;
}

export const useGetSellingPosts = ({
  memberId,
  completed,
  type,
  size = SELLING_PAGE_SIZE,
  enabled = true,
}: UseGetSellingPostsParams) => {
  const query = useInfiniteQuery({
    queryKey: sellingPostsQueryKeys.list({ memberId, completed, type, size }),
    queryFn: ({ pageParam }) =>
      getSellingPosts({ memberId, completed, type, size, lastId: pageParam }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // 빈 배열이거나 size보다 적게 오면 마지막 페이지다. 정확히 size개인 마지막
      // 페이지는 다음 빈 페이지를 받아야 끝을 알 수 있다(계약 그대로).
      if (lastPage.length < size) return undefined;

      const nextCursor = lastPage[lastPage.length - 1]?.id;
      if (nextCursor == null) return undefined;

      // 대상 환경에 아직 페이지 계약이 반영되지 않아 size/last_id를 무시하고 매번 전체
      // 배열을 주는 서버에서는 커서가 전진하지 않는다. 같은 페이지를 무한히 더 불러오지
      // 않도록 여기서 멈춘다(전체 배열을 그대로 보여주는 기존 동작으로 수렴한다).
      if (lastPageParam != null && nextCursor >= lastPageParam) return undefined;

      return nextCursor;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const posts = useMemo(() => {
    const seen = new Set<number>();

    return (query.data?.pages ?? []).flat().filter((post: PostType) => {
      // 서버가 mode 필터를 반영하지 않는 경우를 대비한 방어. 중복 id도 함께 걸러
      // 페이지 경계에서 같은 카드가 두 번 그려지지 않게 한다.
      if (post.mode !== MODE.GIVER) return false;
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }, [query.data]);

  // FlatList의 onEndReached는 리렌더 전에 연달아 발화할 수 있어, 렌더 상태인
  // isFetchingNextPage만으로는 같은 페이지를 여러 번 요청하게 된다. ref로 실제 요청
  // 진행 여부를 즉시 반영해 중복 요청을 막는다.
  const isLoadingMoreRef = useRef(false);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    posts,
    error: query.error,
    isError: query.isError,
    isPending: query.isPending,
    isRefetching: query.isRefetching,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    loadMore,
    retryNextPage: fetchNextPage,
    refetch: query.refetch,
  };
};
