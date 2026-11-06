import type { ModeType } from '~/shared/types/mode';
import type { ProductType } from '~/shared/types/type';

// 게시글 쿼리 키. 목록 조회(useGetPosts)와 작성·수정·삭제·차단 후 무효화가 같은 키를 쓰게 한다
export const postKeys = {
  all: ['posts'] as const,
  list: (mode?: ModeType, type?: ProductType) => [...postKeys.all, mode, type] as const,
  // 상세는 all 밖에 둔다. 삭제 후 목록을 무효화할 때 아직 마운트된 상세 화면이 404로 재조회되지 않게 하려는 것.
  // 라우트 파라미터(string)와 서버 id(number)가 섞여 들어오므로 String으로 맞춘다
  detail: (id: string | number) => ['post', String(id)] as const,
} as const;
