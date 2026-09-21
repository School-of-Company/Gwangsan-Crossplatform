import { useMemo, useCallback, memo, useState } from 'react';
import { View, Dimensions, ScrollView } from 'react-native';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper } from '~/shared/ui';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { useBottomSheetScrollLock } from '~/shared/lib/useBottomSheetScrollLock';
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
  const { dragLockRef, handleScroll } = useBottomSheetScrollLock();

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
    if (isLoading) return '거래 취소 처리 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '거래취소하기';
  }, [isLoading, imageUploadState]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={handleClose}
      onAnimationComplete={onAnimationComplete}
      dragLockRef={dragLockRef}
      title="거래취소하기">
      <View className="flex-1 flex-col gap-4">
        {/* 키보드가 올라오면 시트 안에서 쓸 수 있는 높이가 줄어들기 때문에,
            내용은 스크롤로 감싸고 제출 버튼만 하단에 고정한다. */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 24, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}>
          <TextField
            label="거래취소사유"
            placeholder="거래취소사유를 입력해주세요"
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
        </ScrollView>

        <Button variant="error" disabled={isFormDisabled} onPress={handleFormSubmit}>
          {getSubmitButtonText}
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default memo(CancelTradeBottomSheet);
