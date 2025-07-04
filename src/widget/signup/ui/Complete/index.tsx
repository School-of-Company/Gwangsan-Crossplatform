import { View, Text, Image } from 'react-native';
import { Button } from '@/shared/ui/Button';
import gwangsanLogo from '@/shared/assets/png/gwangsanLogo.png';
import { router } from 'expo-router';
import { useSignupStore } from '@/shared/store/useSignupStore';

export default function Complete() {
  const { resetStore } = useSignupStore();

  const handleNext = () => {
    router.navigate('/onboarding');
    resetStore();
  };

  return (
    <View className="flex-1 gap-8 bg-white px-6">
      <View className="mt-44 flex-col items-center justify-center">
        <Image source={gwangsanLogo} style={{ width: 256, height: 256 }} />
        <Text className="text-center text-2xl font-bold text-[#0075C2]">
          회원가입이 {'\n'} 완료되었습니다
        </Text>
      </View>
      <View className="mb-8 mt-auto">
        <Button onPress={handleNext}>로그인 페이지로 돌아가기</Button>
      </View>
    </View>
  );
}
