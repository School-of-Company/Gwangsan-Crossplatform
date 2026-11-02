import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { FeedbackType } from './createFeedback';

// 서버 계약 (Gwangsan-Server FeedbackController GET /api/feedback/me)
// - size 1~100(기본 10). 응답은 envelope 없이 배열이며 feedbackId 내림차순이다.
// - 첫 요청은 last_id 생략, 다음 요청은 직전 페이지 마지막 feedbackId를 last_id로 보낸다.
// - 서버는 id < last_id 인 내 문의만 돌려준다.
export const MY_FEEDBACK_PAGE_SIZE = 20;

export type FeedbackStatus = 'RECEIVED' | 'IN_PROGRESS' | 'DONE';

export interface FeedbackImage {
  imageId: number;
  imageUrl: string;
}

export interface MyFeedbackResponse {
  feedbackId: number;
  type: FeedbackType;
  content: string;
  images: FeedbackImage[];
  status: FeedbackStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

export interface GetMyFeedbacksParams {
  lastId?: number | null;
  size?: number;
}

export const getMyFeedbacks = async ({
  lastId,
  size = MY_FEEDBACK_PAGE_SIZE,
}: GetMyFeedbacksParams = {}): Promise<MyFeedbackResponse[]> => {
  try {
    const { data } = await instance.get<MyFeedbackResponse[]>('/feedback/me', {
      params: { size, ...(lastId == null ? {} : { last_id: lastId }) },
    });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw toAppError(error);
  }
};

// 회원용 단건 조회 API가 없어서(상세 조회는 관리자 전용) 목록 API로 한 건만 가져온다.
// last_id = id + 1, size = 1이면 "id 이하인 내 문의 중 가장 큰 것"이 오므로, id가 같을
// 때만 내 문의로 인정하고 아니면 null(없거나 남의 문의)로 본다.
export const getMyFeedback = async (feedbackId: number): Promise<MyFeedbackResponse | null> => {
  const [item] = await getMyFeedbacks({ lastId: feedbackId + 1, size: 1 });
  return item?.feedbackId === feedbackId ? item : null;
};
