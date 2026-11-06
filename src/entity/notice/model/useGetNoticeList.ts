import { useQuery } from '@tanstack/react-query';
import { getNoticeList } from '../api/getNoticeList';
import { NoticeListData } from './noticeData';
import { noticeKeys } from './noticeQueryKeys';

export const useGetNoticeList = () => {
  return useQuery<NoticeListData[]>({
    queryKey: noticeKeys.list(),
    queryFn: getNoticeList,
  });
};
