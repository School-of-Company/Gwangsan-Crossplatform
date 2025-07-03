import { View } from 'react-native';
import { Dropdown } from '~/shared/ui/Dropdown';
import { Input } from '~/shared/ui/Input';

export default function SignupPage() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Input label="회원가입" />
      <Dropdown<string> label="회원가입" placeholder="지점섲낻" items={['exam1', 'exam2']} />
    </View>
  );
} 