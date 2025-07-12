import { useQuery } from '@tanstack/react-query';
import { getNoticeList } from '../api/getNoticeList';
import { NoticeListData } from './noticeData';

export const useGetNoticeList = () => {
  return useQuery<NoticeListData[]>({
    queryKey: ['noticeList'],
    queryFn: getNoticeList,
  });
};
