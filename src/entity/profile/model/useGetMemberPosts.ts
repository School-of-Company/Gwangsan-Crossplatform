import { useQuery } from '@tanstack/react-query';
import { PostType } from '~/shared/types/postType';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';
import { getMemberPosts } from '../api/getMemberPosts';

export const useGetMemberPosts = (id: string | null) => {
  return useQuery<PostType[]>({
    queryKey: profileQueryKeys.memberPosts(id),
    queryFn: () => getMemberPosts(id!),
    enabled: !!id,
  });
};
