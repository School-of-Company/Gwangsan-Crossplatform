import { useQuery } from '@tanstack/react-query';
import { getNoticeDetail } from '../api/getNoticeDetail';
import { NoticeData } from './noticeData';

export const useGetNoticeDetail = (noticeId: number | string | undefined) => {
  const id = noticeId ? Number(noticeId) : undefined;

  return useQuery<NoticeData>({
    queryKey: ['noticeDetail', id],
    queryFn: () => {
      if (!id) {
        throw new Error('Notice ID is required');
      }
      return getNoticeDetail(id);
    },
    enabled: !!id,
  });
};
