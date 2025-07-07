import { View, Dimensions } from 'react-native';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper, ProgressBar } from '~/shared/ui';

interface ReviewsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (type: number, contents: string) => void;
  light: number;
  setLight: (v: number) => void;
  contents: string;
  onContentsChange: (contents: string) => void;
}

const ReviewsModal = ({
  isVisible,
  onClose,
  onSubmit,
  light,
  setLight,
  contents,
  onContentsChange,
}: ReviewsModalProps) => {
  const isDisabled = contents.trim().length === 0;

  const handleSubmit = () => {
    if (contents.trim()) {
      onSubmit(light, contents.trim());
      setLight(60);
      onContentsChange('');
    }
  };

  const maxTextFieldHeight = Dimensions.get('window').height * 0.2;

  return (
    <BottomSheetModalWrapper isVisible={isVisible} onClose={onClose} title="신고하기">
      <View className="flex-1 flex-col justify-between gap-6">
        <View className="gap-8">
          <ProgressBar value={light} onChange={setLight} />
          <TextField
            label="후기 작성"
            placeholder="거래의 후기를 입력해주세요"
            value={contents}
            onChangeText={onContentsChange}
            multiline
            style={{ maxHeight: maxTextFieldHeight }}
          />
        </View>
        <Button disabled={isDisabled} onPress={handleSubmit}>
          작성완료
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default ReviewsModal;
