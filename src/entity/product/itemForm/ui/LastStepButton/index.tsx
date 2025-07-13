import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';

interface LastStepButtonProps {
  onEditPress: () => void;
  onCompletePress: () => void;
  disabled?: boolean;
  buttonText?: string;
}

const LastStepButton = ({
  onEditPress,
  onCompletePress,
  disabled = false,
  buttonText = '완료',
}: LastStepButtonProps) => (
  <View className="flex flex-row gap-6 px-6 pt-16">
    <View className="flex-1">
      <Button onPress={onEditPress} disabled={disabled}>
        수정
      </Button>
    </View>
    <View className="flex-1">
      <Button variant="secondary" onPress={onCompletePress} disabled={disabled}>
        {buttonText}
      </Button>
    </View>
  </View>
);

export default LastStepButton;
