import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { MODE } from '~/shared/types/mode';
import type { PostType } from '~/shared/types/postType';
import type { ProductType } from '~/shared/types/type';

// 서버 페이지 계약 (School-of-Company/Gwangsan-Server#405)
// - GET /api/post/current, GET /api/post/member/{member_id}
// - size 1~100. 응답은 페이지 envelope가 아니라 게시글 배열이며 id 내림차순이다.
// - 첫 요청은 last_id 생략, 다음 요청은 직전 페이지 마지막 게시글 id를 last_id로 전달한다.
// - last_id / completed를 사용할 때 size는 필수다.
export const SELLING_PAGE_SIZE = 20;

export interface GetSellingPostsParams {
  // 본인 목록이면 생략하고, 다른 회원 목록이면 그 회원 id를 넘긴다.
  memberId?: string;
  // 생략하면 삭제 제외 전체 상태. false면 판매중 + 예약중, true면 판매완료.
  completed?: boolean;
  type?: ProductType;
  size?: number;
  lastId?: number | null;
}

export const getSellingPosts = async ({
  memberId,
  completed,
  type,
  size = SELLING_PAGE_SIZE,
  lastId,
}: GetSellingPostsParams): Promise<PostType[]> => {
  try {
    const url = memberId ? `/post/member/${memberId}` : '/post/current';
    const { data } = await instance.get<PostType[]>(url, {
      params: {
        mode: MODE.GIVER,
        size,
        ...(type === undefined ? {} : { type }),
        ...(completed === undefined ? {} : { completed }),
        ...(lastId == null ? {} : { last_id: lastId }),
      },
    });

    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
