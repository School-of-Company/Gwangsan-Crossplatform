import React, { useMemo, useCallback } from 'react';
import { View, Dimensions } from 'react-native';
import { Dropdown } from '~/shared/ui/Dropdown';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper } from '~/shared/ui';

const REPORT_TYPES = ['부적절한 게시글', '스팸/홍보', '욕설/비방', '기타'] as const;

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (type: string, reason: string) => void;
  reportType: string | null;
  contents: string;
  onReportTypeChange: (type: string | null) => void;
  onContentsChange: (reason: string) => void;
  onAnimationComplete?: () => void;
}

const ReportModal = ({
  isVisible,
  onClose,
  onSubmit,
  reportType,
  contents,
  onReportTypeChange,
  onContentsChange,
  onAnimationComplete,
}: ReportModalProps) => {
  const isDisabled = useMemo(
    () => !reportType || contents.trim().length === 0,
    [reportType, contents]
  );

  const handleSubmit = useCallback(() => {
    if (reportType && contents.trim()) {
      onSubmit(reportType, contents.trim());
      onClose();
    }
  }, [reportType, contents, onSubmit, onClose]);

  const maxTextFieldHeight = useMemo(() => Dimensions.get('window').height * 0.2, []);

  const reportTypeItems = useMemo(() => REPORT_TYPES as unknown as string[], []);

  const handleDropdownSelect = useCallback(
    (value: string) => {
      onReportTypeChange(value);
    },
    [onReportTypeChange]
  );

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      onAnimationComplete={onAnimationComplete}
      title="신고하기">
      <View className="flex-1 flex-col justify-between gap-6">
        <View className="gap-8">
          <Dropdown
            label="신고유형"
            items={reportTypeItems}
            placeholder="신고유형을 선택해주세요."
            selectedItem={reportType ?? undefined}
            onSelect={handleDropdownSelect}
          />
          <TextField
            label="신고사유"
            placeholder="신고사유를 입력해주세요"
            value={contents}
            onChangeText={onContentsChange}
            multiline
            style={{ maxHeight: maxTextFieldHeight }}
          />
        </View>
        <Button variant="error" disabled={isDisabled} onPress={handleSubmit}>
          신고하기
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default React.memo(ReportModal);
