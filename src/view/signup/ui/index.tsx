import { View, Text } from 'react-native';
import { Input } from '@/shared/ui/Input';

export default function SignupPageView() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>회원가입</Text>
      <Text>이름을 입력해주세요</Text>
      <Input label="회원가입" />
    </View>
  );
}
