import { useMemo, useCallback, memo, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper } from '~/shared/ui';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { useCancelTrade } from '../../model/useCancelTrade';

interface CancelTradeBottomSheetProps {
  productId?: number;
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
}

const CancelTradeBottomSheet = ({
  productId,
  isVisible,
  onClose,
  onAnimationComplete,
}: CancelTradeBottomSheetProps) => {
  const [images, setImages] = useState<string[]>([]);

  const {
    resetForm,
    handleSubmit,
    setReason,
    reason,
    setImageIds,
    setImageUploadState,
    canSubmit,
    isLoading,
    imageUploadState,
  } = useCancelTrade({
    productId,
    onSuccess: onClose,
  });

  const handleFormSubmit = useCallback(() => {
    if (reason.trim()) {
      handleSubmit(reason.trim());
    }
  }, [reason, handleSubmit]);

  const handleClose = useCallback(() => {
    resetForm();
    setImages([]);
    onClose();
  }, [resetForm, onClose]);

  const maxTextFieldHeight = useMemo(() => Dimensions.get('window').height * 0.15, []);

  const handleImageIdsChange = useCallback(
    (imageIds: number[]) => {
      setImageIds(imageIds);
    },
    [setImageIds]
  );

  const handleUploadStateChange = useCallback(
    (uploadState: ImageUploadState) => {
      setImageUploadState(uploadState);
    },
    [setImageUploadState]
  );

  const isFormDisabled = useMemo(() => !canSubmit || isLoading, [canSubmit, isLoading]);

  const getSubmitButtonText = useMemo(() => {
    if (isLoading) return '거래 철회 처리 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '거래철회하기';
  }, [isLoading, imageUploadState]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={handleClose}
      onAnimationComplete={onAnimationComplete}
      title="거래철회하기">
      <View className="flex-1 flex-col justify-between gap-4">
        <View className="gap-6">
          <TextField
            label="거래철회사유"
            placeholder="거래철회사유를 입력해주세요"
            value={reason}
            onChangeText={setReason}
            multiline
            style={{ maxHeight: maxTextFieldHeight }}
          />

          <View>
            <ImageUploader
              images={images}
              title="증빙 이미지"
              onImagesChange={setImages}
              onImageIdsChange={handleImageIdsChange}
              onUploadStateChange={handleUploadStateChange}
            />
          </View>
        </View>

        <Button variant="error" disabled={isFormDisabled} onPress={handleFormSubmit}>
          {getSubmitButtonText}
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default memo(CancelTradeBottomSheet);
