import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import { NoticeData } from '../model/noticeData';

export const getNoticeDetail = async (noticeId: number): Promise<NoticeData> => {
  try {
    const { data } = await instance.get<NoticeData>(`/notice/${noticeId}`);
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
