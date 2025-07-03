import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';

const AuthButtonContainer = () => {
  return (
    <View className="space-y-3">
      <Button>회원가입</Button>
      <Button>로그인</Button>
    </View>
  );
};

export default AuthButtonContainer;
