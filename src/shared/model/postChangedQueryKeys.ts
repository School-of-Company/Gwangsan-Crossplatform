import type { QueryClient } from '@tanstack/react-query';
import { postKeys } from './postQueryKeys';
import { profileQueryKeys } from './profileQueryKeys';
import { sellingPostsQueryKeys } from './sellingPostsQueryKeys';

// 게시글을 작성·수정·삭제하면 함께 바뀌는 목록. 변경 훅은 entity/write·post에 있고 판매중·내 글 조회는
// entity/profile에 있어, 같은 레이어 슬라이스끼리 import하지 않도록 shared에 모은다
export const postChangedQueryKeys = [
  postKeys.all,
  sellingPostsQueryKeys.all,
  profileQueryKeys.myPostsAll,
  profileQueryKeys.memberPostsAll,
] as const;

export const invalidatePostChangedQueries = (queryClient: QueryClient) => {
  postChangedQueryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
};
