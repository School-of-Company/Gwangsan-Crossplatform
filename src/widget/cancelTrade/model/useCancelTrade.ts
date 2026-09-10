import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { ImageUploadState } from '~/shared/ui/ImageUploader';
import { cancelTrade } from '../api/cancelTrade';
import Toast from 'react-native-toast-message';
import { produce } from 'immer';

interface useCancelTradeProps {
  productId?: number;
  onSuccess?: () => void;
}

interface CancelFormState {
  reason: string;
  imageIds: number[];
  imageUploadState?: ImageUploadState;
}

export const useCancelTrade = ({ productId, onSuccess }: useCancelTradeProps) => {
  const [formState, setFormState] = useState<CancelFormState>({
    reason: '',
    imageIds: [],
  });
  const queryClient = useQueryClient();

  const cancelTradeMutation = useMutation({
    mutationFn: (data: { reason: string; imageIds: number[]; productId: number }) =>
      cancelTrade(data.reason, data.imageIds, data.productId),
    onSuccess: (data) => {
      if (data.cancelled) {
        // 상대방이 이미 같은 거래의 철회를 요청해 둔 상태 — 양측 동의로 간주되어
        // 관리자 승인 없이 그 자리에서 철회(광산 환불)까지 끝난다.
        queryClient.invalidateQueries({ queryKey: ['myInformation'] });
        queryClient.invalidateQueries({ queryKey: ['myProfile', 'current'] });
        Toast.show({
          type: 'success',
          text1: '거래취소 완료',
          text2: '상대방도 동의하여 거래가 철회되었습니다. 광산이 환불되었습니다.',
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: '거래취소 접수',
          text2: '거래취소가 접수되었습니다. 관리자 승인 후 처리됩니다.',
          visibilityTime: 2000,
        });
      }
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '거래취소 실패',
        text2: error instanceof Error ? error.message : '거래취소 처리 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });
  const resetForm = useCallback(() => {
    setFormState({
      reason: '',
      imageIds: [],
    });
  }, []);

  const setReason = useCallback((value: string) => {
    setFormState((prev) =>
      produce(prev, (draft) => {
        draft.reason = value;
      })
    );
  }, []);

  const setImageIds = useCallback((value: number[]) => {
    setFormState((prev) =>
      produce(prev, (draft) => {
        draft.imageIds = value;
      })
    );
  }, []);

  const setImageUploadState = useCallback((value: ImageUploadState) => {
    setFormState((prev) =>
      produce(prev, (draft) => {
        draft.imageUploadState = value;
      })
    );
  }, []);

  const canSubmit = useMemo(() => {
    const { reason, imageUploadState } = formState;

    if (!productId) return false;
    if (!reason.trim()) return false;

    if (imageUploadState) {
      if (imageUploadState.hasUploadingImages || imageUploadState.hasFailedImages) {
        return false;
      }
    }

    return true;
  }, [formState, productId]);

  const handleSubmit = useCallback(
    (reason: string) => {
      if (formState.imageUploadState?.hasUploadingImages) {
        Toast.show({
          type: 'error',
          text1: '이미지 업로드가 완료될 때까지 기다려주세요.',
          visibilityTime: 3000,
        });
        return;
      }

      if (formState.imageUploadState?.hasFailedImages) {
        Toast.show({
          type: 'error',
          text1: '이미지 업로드 실패',
          visibilityTime: 3000,
        });
        return;
      }

      if (productId) {
        cancelTradeMutation.mutate({
          reason: reason,
          imageIds: formState.imageIds,
          productId: productId,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '거래취소 실패',
          visibilityTime: 3000,
        });
      }
    },
    [formState, productId, cancelTradeMutation]
  );

  return {
    reason: formState.reason,
    setReason: setReason,
    imageIds: formState.imageIds,
    setImageIds,
    setImageUploadState,
    handleSubmit,
    resetForm,
    canSubmit,
    isLoading: cancelTradeMutation.isPending,
    error: cancelTradeMutation.error,
    imageUploadState: formState.imageUploadState,
  };
};
