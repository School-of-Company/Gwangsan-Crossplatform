import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { createReview } from '~/entity/post/api/createReview';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { useDeletePost } from '~/entity/post';
import { useTradeRequest } from '~/entity/post/hooks/useTradeRequest';
import { useChatEntry } from '~/shared/lib/useChatEntry';
import { checkIsMyPost } from '~/shared/lib/userUtils';

interface UsePostPageLogicParams {
  readonly id: string;
  readonly review?: string;
}

export const usePostAction = ({ id, review }: UsePostPageLogicParams) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useGetItem(id);
  const { deletePost, isLoading: isDeleting } = useDeletePost();
  const { navigateToChat, isLoading: isChatLoading } = useChatEntry();

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
            // 이 화면에는 거래 상대 정보가 없어 글 작성자를 대상으로 보낸다.
            // 내 글이면 대상이 나가 되므로 리뷰 작성 버튼 자체를 노출하지 않는다
            otherMemberId: data.member.memberId,
            content: contents,
            light: light,
          });
          queryClient.invalidateQueries({ queryKey: ['reviews'] });
          Toast.show({
            type: 'success',
            text1: '리뷰가 성공적으로 작성되었습니다.',
          });
          setIsReviewModalVisible(false);
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: '리뷰 작성 실패',
            text2: error instanceof Error ? error.message : '리뷰 작성 중 오류가 발생했습니다.',
          });
        }
      },
      [id, data, queryClient]
    ),
  };

  const navigationHandlers = {
    goToEdit: useCallback(() => {
      if (id) {
        router.push(`/write?id=${id}`);
      }
    }, [id, router]),
    goToChat: useCallback(async () => {
      if (data?.id) {
        await navigateToChat(data.id);
      }
    }, [data, navigateToChat]),
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
    onTradeRequest: tradeRequest.hasPendingRequest
      ? tradeRequest.handleWithdrawTradeRequest
      : tradeRequest.handleTradeRequest,
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
    headerTitle:
      data?.mode === 'RECEIVER'
        ? data.type === 'OBJECT'
          ? '필요해요'
          : '해주세요'
        : data?.type === 'OBJECT'
          ? '팔아요'
          : '할 수 있어요',
    canTrade: data?.mode === 'RECEIVER' && data?.isCompletable && !data?.isCompleted,
    isTradeButtonDisabled:
      tradeRequest.isLoading ||
      tradeRequest.isWithdrawing ||
      data?.isCompleted ||
      (!data?.isCompletable && !tradeRequest.hasPendingRequest),
    tradeButtonText: tradeRequest.isLoading
      ? '신청 중...'
      : tradeRequest.isWithdrawing
        ? '취소 중...'
        : data?.isCompleted
          ? '거래완료됨'
          : tradeRequest.hasPendingRequest
            ? '요청 취소'
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
