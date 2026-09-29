import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { deletePost } from '../api/deletePost';
import { ProductType } from '~/shared/types/type';
import { ModeType } from '~/shared/types/mode';
import { postKeys } from '~/shared/model/postQueryKeys';

interface UseDeletePostParams {
  onSuccess?: () => void;
  // 게시글 목록 외에 함께 무효화할 쿼리(판매·구매 내역 등). 판매내역 화면이 이 훅을 그대로 복사해
  // 무효화 키만 바꿔 쓰던 중복을 없애기 위해 추가했다(#741)
  invalidateKeys?: readonly QueryKey[];
}

export const useDeletePost = ({ onSuccess, invalidateKeys = [] }: UseDeletePostParams = {}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: postKeys.all,
      });
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

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

  const getRedirectPath = useCallback((type: ProductType, mode: ModeType): string => {
    return `/post?type=${type}&mode=${mode}`;
  }, []);

  const handleDeletePost = useCallback(
    (postId: number, type: ProductType, mode: ModeType) => {
      deletePostMutation.mutate(postId, {
        onSuccess: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(getRedirectPath(type, mode));
          }
        },
      });
    },
    [deletePostMutation, getRedirectPath, router]
  );

  // 목록 화면처럼 삭제 후 이동하지 않고 그 자리에서 목록만 갱신하는 경우
  const deletePostInPlace = useCallback(
    (postId: number) => deletePostMutation.mutate(postId),
    [deletePostMutation]
  );

  return {
    deletePost: handleDeletePost,
    deletePostInPlace,
    isLoading: deletePostMutation.isPending,
    error: deletePostMutation.error,
  };
};
