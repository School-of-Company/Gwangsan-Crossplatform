import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';

interface NextButtonProps {
  disabled: boolean;
  onPress: () => void;
}

const NextButton = ({ disabled, onPress }: NextButtonProps) => (
  <View className="px-6">
    <Button disabled={disabled} onPress={onPress}>
      다음
    </Button>
  </View>
);

export default NextButton;
