import { Text, View } from 'react-native';
import { Button } from '~/shared/ui/Button';
import { router } from 'expo-router';

const AuthButtonContainer = () => {
  return (
    <View className="flex flex-col gap-3 px-6 ">
      <Button onPress={() => router.push('/signin')}>로그인</Button>
      <Button variant="secondary" onPress={() => router.push('/signup')}>
        회원가입
      </Button>
      <View className="flex-row justify-center gap-4">
        <Text
          className="text-sm text-gray-500 underline"
          onPress={() => router.push('/findNickname')}>
          별칭 찾기
        </Text>
        <Text
          className="text-sm text-gray-500 underline"
          onPress={() => router.push('/resetPassword')}>
          비밀번호 변경하기
        </Text>
      </View>
    </View>
  );
};

export default AuthButtonContainer;
