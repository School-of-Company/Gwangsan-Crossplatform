import React, { useMemo, useCallback } from 'react';
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
  onAnimationComplete?: () => void;
}

const ReviewsModal = ({
  isVisible,
  onClose,
  onSubmit,
  light,
  setLight,
  contents,
  onContentsChange,
  onAnimationComplete,
}: ReviewsModalProps) => {
  const isDisabled = useMemo(() => contents.trim().length === 0, [contents]);

  const handleSubmit = useCallback(() => {
    if (contents.trim()) {
      onSubmit(light, contents.trim());
      onClose();
    }
  }, [contents, light, onSubmit, onClose]);

  const maxTextFieldHeight = useMemo(() => Dimensions.get('window').height * 0.2, []);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      onAnimationComplete={onAnimationComplete}
      title="신고하기">
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

export default React.memo(ReviewsModal);
