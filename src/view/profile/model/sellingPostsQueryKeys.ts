import type { ProductType } from '~/shared/types/type';

interface SellingPostsKeyParams {
  memberId?: string;
  completed?: boolean;
  type?: ProductType;
  size: number;
}

// 회원 · type · completed · size가 다르면 서로 다른 목록이므로 커서도 따로 관리한다.
// 전체 후기 조회(useGetReviews)와는 키가 완전히 분리되어 기존 후기 연결은 영향을 받지 않는다.
export const sellingPostsQueryKeys = {
  all: ['sellingPosts'] as const,
  list: ({ memberId, completed, type, size }: SellingPostsKeyParams) =>
    ['sellingPosts', memberId ?? 'current', { completed, type, size }] as const,
};
