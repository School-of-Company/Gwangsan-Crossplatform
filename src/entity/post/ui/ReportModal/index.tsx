import { useMemo, useCallback, memo, useState } from 'react';
import { View, Dimensions, ScrollView } from 'react-native';
import { Dropdown } from '~/shared/ui/Dropdown';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { REPORT_TYPES, type ReportType } from '~/entity/post/model/reportType';
import { useReport } from '../../model/useReport';
import ImageUploader, { type ImageUploadState } from '~/shared/ui/ImageUploader';
import { useBottomSheetScrollLock } from '~/shared/lib/useBottomSheetScrollLock';

interface ReportModalProps {
  productId?: number;
  memberId?: number;
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
}

const ReportModal = ({
  productId,
  memberId,
  isVisible,
  onClose,
  onAnimationComplete,
}: ReportModalProps) => {
  const [images, setImages] = useState<string[]>([]);
  const { dragLockRef, handleScroll } = useBottomSheetScrollLock();

  const {
    reportType,
    contents,
    setReportType,
    setContents,
    setImageIds,
    setImageUploadState,
    handleSubmit,
    resetForm,
    canSubmit,
    isLoading,
    imageUploadState,
  } = useReport({
    productId,
    memberId,
    onSuccess: onClose,
  });

  const handleFormSubmit = useCallback(() => {
    if (reportType && contents.trim()) {
      handleSubmit(reportType, contents.trim());
    }
  }, [reportType, contents, handleSubmit]);

  const handleClose = useCallback(() => {
    resetForm();
    setImages([]);
    onClose();
  }, [resetForm, onClose]);

  const maxTextFieldHeight = useMemo(() => Dimensions.get('window').height * 0.15, []);

  const handleDropdownSelect = useCallback(
    (value: ReportType) => {
      setReportType(value);
    },
    [setReportType]
  );

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
    if (isLoading) return '신고 처리 중...';
    if (imageUploadState?.hasUploadingImages) return '이미지 업로드 중...';
    if (imageUploadState?.hasFailedImages) return '이미지 업로드 실패';
    return '신고하기';
  }, [isLoading, imageUploadState]);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={handleClose}
      onAnimationComplete={onAnimationComplete}
      dragLockRef={dragLockRef}
      title="신고하기">
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
          <Dropdown
            label="신고유형"
            items={REPORT_TYPES}
            placeholder="신고유형을 선택해주세요."
            selectedItem={reportType ?? undefined}
            onSelect={handleDropdownSelect}
          />

          <TextField
            label="신고사유"
            placeholder="신고사유를 입력해주세요"
            value={contents}
            onChangeText={setContents}
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

export default memo(ReportModal);
