import { useMutation } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { ImageUploadState } from '~/shared/ui/ImageUploader';
import { cancelTrade } from '../api/cancelTrade';
import Toast from 'react-native-toast-message';

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

  const cancelTradeMutation = useMutation({
    mutationFn: (data: { reason: string; imageIds: number[]; productId: number }) =>
      cancelTrade(data.reason, data.imageIds, data.productId),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: '거래철회 완료',
        text2: '거래철회가 성공적으로 접수되었습니다.',
        visibilityTime: 2000,
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '거래철회 실패',
        text2: error instanceof Error ? error.message : '거래철회 처리 중 오류가 발생했습니다.',
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

  const setReason = useCallback((contents: string) => {
    setFormState((prev) => ({ ...prev, contents }));
  }, []);

  const setImageIds = useCallback((imageIds: number[]) => {
    setFormState((prev) => ({ ...prev, imageIds }));
  }, []);

  const setImageUploadState = useCallback((imageUploadState: ImageUploadState) => {
    setFormState((prev) => ({ ...prev, imageUploadState }));
  }, []);

  const canSubmit = useMemo(() => {
    const { reason, imageUploadState } = formState;

    if (!reason.trim() && productId) return false;

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
          text1: '거래철회 실패',
          visibilityTime: 3000,
        });
      }
    },
    [formState, productId, cancelTradeMutation]
  );

  return {
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
