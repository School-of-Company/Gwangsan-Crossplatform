import { View, Text, Image } from 'react-native';
import { Button } from '@/shared/ui/Button';
import gwangsanLogo from '@/shared/assets/png/gwangsanLogo.png';

export default function Complete() {

  const handleNext = () => {
    console.log('handleNext');
  };

  return (
    <View className="flex-1 bg-white px-6 gap-8">
      <View className="mt-44 flex-col items-center justify-center">
        <Image source={gwangsanLogo} style={{ width: 256, height: 256 }} />
        <Text className="text-2xl font-bold text-center text-[#0075C2]">회원가입이 {'\n'} 완료되었습니다</Text>
      </View>
      <View className="mt-auto mb-8">
        <Button
          onPress={handleNext}
        >
          로그인 페이지로 돌아가기
        </Button>
      </View>
    </View>
  );
}