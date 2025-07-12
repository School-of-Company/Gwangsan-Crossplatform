import { useQuery } from '@tanstack/react-query';
import { getItem, PostDetailResponse } from '../api/getItem';

export const useGetItem = (postId: string | undefined) => {
  return useQuery<PostDetailResponse>({
    queryKey: ['post', postId],
    queryFn: () => {
      if (!postId) {
        throw new Error('need ID.');
      }
      return getItem(postId);
    },
    enabled: !!postId,
  });
}; 