import { NextButton, LastStepButton } from '~/entity/write/itemForm';
import type { ImageUploadState } from '@/shared/ui/ImageUploader';
import { useMemo } from 'react';

interface ItemFormRenderButtonProps {
  step: number;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  onNextStep: (step: number) => void;
  onEditPress: () => void;
  onCompletePress: () => void;
  isSubmitting?: boolean;
  imageUploadState?: ImageUploadState;
}

const ItemFormRenderButton = ({
  step,
  isStep1Valid,
  isStep2Valid,
  onNextStep,
  onEditPress,
  onCompletePress,
  isSubmitting = false,
  imageUploadState,
}: ItemFormRenderButtonProps) => {
  const getButtonText = useMemo(() => {
    if (isSubmitting) return '등록 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '등록하기';
  }, [isSubmitting, imageUploadState]);

  const isLastStepDisabled = useMemo(() => {
    return (
      isSubmitting || imageUploadState?.hasUploadingImages || imageUploadState?.hasFailedImages
    );
  }, [isSubmitting, imageUploadState]);

  switch (step) {
    case 1:
      return <NextButton disabled={!isStep1Valid} onPress={() => onNextStep(2)} />;
    case 2:
      return <NextButton disabled={!isStep2Valid} onPress={() => onNextStep(3)} />;
    case 3:
      return (
        <LastStepButton
          onEditPress={onEditPress}
          onCompletePress={onCompletePress}
          disabled={isLastStepDisabled}
          buttonText={getButtonText}
        />
      );
    default:
      return null;
  }
};

export default ItemFormRenderButton;
