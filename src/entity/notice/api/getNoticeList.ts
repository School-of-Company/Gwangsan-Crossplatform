import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import { NoticeListData } from '../model/noticeData';

export const getNoticeList = async (): Promise<NoticeListData[]> => {
  try {
    const { data } = await instance.get<NoticeListData[]>('/notice');
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
