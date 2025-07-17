import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { deletePost } from '../api/deletePost';
import { TYPE, MODE } from '~/shared/types/postType';

interface UseDeletePostParams {
  onSuccess?: () => void;
}

export const useDeletePost = ({ onSuccess }: UseDeletePostParams = {}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['posts'],
      });

      Toast.show({
        type: 'success',
        text1: '게시글 삭제 완료',
        text2: '게시글이 성공적으로 삭제되었습니다.',
        visibilityTime: 2000,
      });
      onSuccess?.();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '게시글 삭제 실패',
        text2: error instanceof Error ? error.message : '게시글 삭제 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });

  const getRedirectPath = useCallback((type: TYPE, mode: MODE): string => {
    return `/post?type=${type}&mode=${mode}`;
  }, []);

  const handleDeletePost = useCallback(
    (postId: number, type: TYPE, mode: MODE) => {
      deletePostMutation.mutate(postId, {
        onSuccess: () => {
          const redirectPath = getRedirectPath(type, mode);
          router.replace(redirectPath);
        },
      });
    },
    [deletePostMutation, getRedirectPath, router]
  );

  return {
    deletePost: handleDeletePost,
    isLoading: deletePostMutation.isPending,
    error: deletePostMutation.error,
  };
};
