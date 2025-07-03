import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';
import { router } from 'expo-router';

const AuthButtonContainer = () => {
  return (
    <View className="flex flex-col gap-3 px-6 ">
      <Button onPress={() => router.push('/signin')}>로그인</Button>
      <Button variant="secondary" onPress={() => router.push('/signup')}>
        회원가입
      </Button>
    </View>
  );
};

export default AuthButtonContainer;
