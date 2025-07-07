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
  reason: string;
  onReportTypeChange: (type: string | null) => void;
  onReasonChange: (reason: string) => void;
}

const ReportModal = ({
  isVisible,
  onClose,
  onSubmit,
  reportType,
  reason,
  onReportTypeChange,
  onReasonChange,
}: ReportModalProps) => {
  const isDisabled = !reportType || reason.trim().length === 0;

  const handleSubmit = () => {
    if (reportType && reason.trim()) {
      onSubmit(reportType, reason.trim());
      onReportTypeChange(null);
      onReasonChange('');
    }
  };

  const maxTextFieldHeight = Dimensions.get('window').height * 0.2;

  return (
    <BottomSheetModalWrapper isVisible={isVisible} onClose={onClose} title="신고하기">
      <View className="flex-1 flex-col justify-between gap-6">
        <View className="gap-8">
          <Dropdown
            label="신고유형"
            items={REPORT_TYPES as unknown as string[]}
            placeholder="신고유형을 선택해주세요."
            selectedItem={reportType ?? undefined}
            onSelect={(v) => onReportTypeChange(v)}
          />
          <TextField
            label="신고사유"
            placeholder="신고사유를 입력해주세요"
            value={reason}
            onChangeText={onReasonChange}
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

export default ReportModal;
