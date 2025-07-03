import { View } from 'react-native';
import { Button } from '~/shared/ui/Button';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '~/shared/types/RootStackParamList';

const AuthButtonContainer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View className="flex flex-col gap-3 px-6 ">
      <Button onPress={() => navigation.navigate('Signin')}>로그인</Button>
      <Button variant="secondary" onPress={() => navigation.navigate('Signup')}>
        회원가입
      </Button>
    </View>
  );
};

export default AuthButtonContainer;
