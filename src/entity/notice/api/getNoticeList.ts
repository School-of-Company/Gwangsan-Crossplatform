import { instance } from '~/shared/lib/axios';
import { NoticeListData } from '../model/noticeData';

export const getNoticeList = async (): Promise<NoticeListData[]> => {
  const { data } = await instance.get<NoticeListData[]>(`/notice`);
  return data;
};