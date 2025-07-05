import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';

interface LastStepButtonProps {
  onEditPress: () => void;
  onCompletePress: () => void;
}

const LastStepButton = ({ onEditPress, onCompletePress }: LastStepButtonProps) => (
  <View className="mb-8 flex flex-row gap-6 px-6 pt-16">
    <View className="flex-1">
      <Button onPress={onEditPress}>수정</Button>
    </View>
    <View className="flex-1">
      <Button variant="secondary" onPress={onCompletePress}>
        완료
      </Button>
    </View>
  </View>
);

export default LastStepButton;
