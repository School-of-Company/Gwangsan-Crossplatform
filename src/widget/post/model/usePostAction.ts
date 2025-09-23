import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { createReview } from '~/entity/post/api/createReview';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useDeletePost } from '~/entity/post';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { useChatNavigation } from '~/shared/lib/useChatNavigation';
import { checkIsMyPost } from '~/shared/lib/userUtils';

interface UsePostPageLogicParams {
  readonly id: string;
  readonly review?: string;
}

export const usePostAction = ({ id, review }: UsePostPageLogicParams) => {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useGetItem(id);
  const { deletePost, isLoading: isDeleting } = useDeletePost();
  const { navigateToChat, isLoading: isChatLoading } = useChatNavigation();

  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(!!review);

  const [reviewLight, setReviewLight] = useState<number>(60);
  const [reviewContents, setReviewContents] = useState('');

  const [isMyPost, setIsMyPost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tradeRequest = useTradeRequest({
    productId: data?.id ?? 0,
    sellerId: data?.member.memberId ?? 0,
  });

  const modalHandlers = {
    openReportModal: useCallback(() => setIsReportModalVisible(true), []),
    closeReportModal: useCallback(() => setIsReportModalVisible(false), []),
    openReviewModal: useCallback(() => setIsReviewModalVisible(true), []),
    closeReviewModal: useCallback(() => setIsReviewModalVisible(false), []),
  };

  const reviewHandlers = {
    onLightChange: useCallback((light: number) => setReviewLight(light), []),
    onContentsChange: useCallback((contents: string) => setReviewContents(contents), []),
    onAnimationComplete: useCallback(() => {
      setReviewLight(60);
      setReviewContents('');
    }, []),
    onSubmit: useCallback(
      async (light: number, contents: string) => {
        if (!id || !data) return;

        try {
          await createReview({
            productId: data.id,
            content: contents,
            light: light,
          });
          Toast.show({
            type: 'success',
            text1: '리뷰가 성공적으로 작성되었습니다.',
          });
          setIsReviewModalVisible(false);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: '리뷰 작성 실패',
            text2: error as string,
          });
        }
      },
      [id, data]
    ),
  };

  const navigationHandlers = {
    goToEdit: useCallback(() => {
      if (id) {
        router.push(`/post/${id}/edit`);
      }
    }, [id, router]),
    goToChat: useCallback(async () => {
      if (data?.id) {
        await navigateToChat(data.id);
      }
    }, [data?.id, navigateToChat]),
  };

  const actionHandlers = {
    onDelete: useCallback(() => {
      if (!data) return;

      Alert.alert('게시글 삭제', '이 게시글을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deletePost(data.id, data.type, data.mode),
        },
      ]);
    }, [data, deletePost]),
    onTradeRequest: tradeRequest.handleTradeRequest,
    onRefresh: useCallback(async () => {
      setRefreshing(true);
      try {
        await refetch();
      } finally {
        setRefreshing(false);
      }
    }, [refetch]),
  };

  useEffect(() => {
    const updateIsMyPost = async () => {
      if (data) {
        const result = await checkIsMyPost(data.member.memberId);
        setIsMyPost(result);
      }
    };
    updateIsMyPost();
  }, [data]);

  const computedValues = {
    headerTitle: data?.mode === 'RECEIVER' ? '해주세요' : '해드립니다',
    canTrade: data?.mode === 'RECEIVER' && data?.isCompletable && !data?.isCompleted,
    isTradeButtonDisabled: tradeRequest.isLoading || data?.isCompleted || !data?.isCompletable,
    tradeButtonText: tradeRequest.isLoading
      ? '신청 중...'
      : data?.isCompleted
        ? '거래완료됨'
        : '거래신청',
  };

  return {
    data,
    isLoading,
    error,
    isMyPost,
    refreshing,
    isDeleting,
    isReportModalVisible,
    isReviewModalVisible,
    reviewLight,
    reviewContents,
    isChatLoading,
    isTradeRequestLoading: tradeRequest.isLoading,
    modalHandlers,
    reviewHandlers,
    navigationHandlers,
    actionHandlers,
    computedValues,
  };
};
