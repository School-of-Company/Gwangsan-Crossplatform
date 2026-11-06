import { useQuery } from '@tanstack/react-query';
import { getItem, PostDetailResponse } from '../api/getItem';
import { postKeys } from '~/shared/model/postQueryKeys';

export const useGetItem = (postId: string | undefined) => {
  return useQuery<PostDetailResponse>({
    queryKey: postKeys.detail(postId ?? ''),
    queryFn: () => {
      if (!postId) {
        throw new Error('need ID.');
      }
      return getItem(postId);
    },
    enabled: !!postId,
  });
};
