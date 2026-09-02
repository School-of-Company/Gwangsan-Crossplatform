import { useMemo, useCallback, memo, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { TextField } from '~/shared/ui/TextField';
import { Button } from '~/shared/ui/Button';
import { BottomSheetModalWrapper, ProgressBar } from '~/shared/ui';

interface ReviewsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (type: number, contents: string) => Promise<void>;
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
  const [localLight, setLocalLight] = useState(light);
  const [localContents, setLocalContents] = useState(contents);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalLight(light);
  }, [light]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalContents(contents);
  }, [contents]);

  const isDisabled = useMemo(() => localContents.trim().length === 0, [localContents]);

  const handleSubmit = useCallback(async () => {
    if (localContents.trim()) {
      await onSubmit(localLight, localContents.trim());
    }
  }, [localContents, localLight, onSubmit]);

  const handleLightChange = useCallback((value: number) => {
    setLocalLight(value);
  }, []);

  const handleContentsChange = useCallback((text: string) => {
    setLocalContents(text);
  }, []);

  const maxTextFieldHeight = useMemo(() => Dimensions.get('window').height * 0.2, []);

  return (
    <BottomSheetModalWrapper
      isVisible={isVisible}
      onClose={onClose}
      onAnimationComplete={onAnimationComplete}
      title="후기 작성">
      <View className="flex-1 flex-col justify-between gap-6">
        {/* 키보드가 올라와 아래 버튼이 인풋에 가까워질 때, ScrollView 안 포커스된 인풋을 RN이
            자동으로 버튼 위(스크롤뷰 영역 안)로 끌어올려주도록 인풋만 스크롤 가능한 영역으로 둔다 */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ gap: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ProgressBar value={localLight} onChange={handleLightChange} />
          <TextField
            label="후기 작성"
            placeholder="거래의 후기를 입력해주세요"
            value={localContents}
            onChangeText={handleContentsChange}
            multiline
            style={{ maxHeight: maxTextFieldHeight }}
          />
        </ScrollView>
        <Button disabled={isDisabled} onPress={handleSubmit}>
          작성완료
        </Button>
      </View>
    </BottomSheetModalWrapper>
  );
};

export default memo(ReviewsModal);
