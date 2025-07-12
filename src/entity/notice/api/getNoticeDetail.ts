import { instance } from '~/shared/lib/axios';
import { NoticeData } from '../model/noticeData';

export const getNoticeDetail = async (noticeId: number): Promise<NoticeData> => {
  const { data } = await instance.get<NoticeData>(`/notice/${noticeId}`);
  return data;
};
