import { useQuery } from '@tanstack/react-query';
import { getNoticeDetail } from '../api/getNoticeDetail';
import { NoticeData } from './noticeData';
import { noticeKeys } from './noticeQueryKeys';

export const useGetNoticeDetail = (noticeId: number | string | undefined) => {
  const id = noticeId ? Number(noticeId) : undefined;

  return useQuery<NoticeData>({
    queryKey: noticeKeys.detail(id),
    queryFn: () => {
      if (!id) {
        throw new Error('Notice ID is required');
      }
      return getNoticeDetail(id);
    },
    enabled: !!id,
  });
};
