import { useMemo, useCallback, memo, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { Dropdown } from '~/shared/ui/Dropdown';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper } from '~/shared/ui';
import { REPORT_TYPE_MAP } from '~/entity/post/model/reportType';
import { useReport } from '../../model/useReport';
import ImageUploader from '~/shared/ui/ImageUploader';

const REPORT_TYPES = Object.keys(REPORT_TYPE_MAP);

interface ReportModalProps {
  sourceId: number;
  isVisible: boolean;
  onClose: () => void;
  onAnimationComplete?: () => void;
}

const ReportModal = ({ sourceId, isVisible, onClose, onAnimationComplete }: ReportModalProps) => {
  const [images, setImages] = useState<string[]>([]);

  const {
    reportType,
    contents,
    setReportType,
    setContents,
    setImageIds,
    handleSubmit,
    resetForm,
    isLoading,
  } = useReport({
    sourceId,
    onSuccess: onClose,
  });

  const isDisabled = useMemo(
    () => !reportType || contents.trim().length === 0 || isLoading,
    [reportType, contents, isLoading]
  );

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
    (value: string) => {
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

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={handleClose}
      onAnimationComplete={onAnimationComplete}
      title="신고하기">
      <View className="flex-1 flex-col justify-between gap-4">
        <View className="gap-6">
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
            />
          </View>
        </View>

        <Button variant="error" disabled={isDisabled} onPress={handleFormSubmit}>
          {isLoading ? '신고 처리 중...' : '신고하기'}
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default memo(ReportModal);
