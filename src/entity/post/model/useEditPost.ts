import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editPost } from '../api/editPost';

interface EditPostData {
  type: string;
  mode: string;
  title: string;
  content: string;
  gwangsan: number;
  imageIds: number[];
}

export const useEditPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditPostData }) => editPost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
