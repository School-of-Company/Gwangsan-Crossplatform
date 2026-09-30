import type { ModeType } from '../types/mode';
import type { ProductType } from '../types/type';

// 게시글 목록 쿼리 키. 목록 조회(useGetPosts)와 작성·수정·삭제·차단 후 무효화가 같은 키를 쓰게 한다(#741)
export const postKeys = {
  all: ['posts'] as const,
  list: (mode?: ModeType, type?: ProductType) => [...postKeys.all, mode, type] as const,
} as const;
