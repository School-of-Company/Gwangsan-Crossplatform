import { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Button } from '@/shared/ui/Button';
import gwangsanLogo from '@/shared/assets/png/gwangsanLogo.png';
import { router } from 'expo-router';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { signup } from '~/entity/auth/api/signup';
import Toast from 'react-native-toast-message';

export default function Complete() {
  const { formData, resetStore } = useSignupStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await signup(formData);

      setIsSuccess(true);
      Toast.show({
        type: 'success',
        text1: '회원가입 완료',
        text2: '성공적으로 가입되었습니다.',
      });
    } catch (err) {
      setIsSuccess(false);
      if (err instanceof Error) {
        setError(err.message);
        Toast.show({
          type: 'error',
          text1: '회원가입 실패',
          text2: err.message,
        });
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
        Toast.show({
          type: 'error',
          text1: '회원가입 실패',
          text2: '회원가입 중 오류가 발생했습니다.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    handleSignup();
  }, [handleSignup]);

  const handleNext = () => {
    router.navigate('/signin');
    resetStore();
  };

  const handleRetry = () => {
    resetStore(); // 회원가입 정보 초기화
    router.navigate('/onboarding'); 
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <ActivityIndicator size="large" color="#0075C2" />
        <Text className="mt-4 text-lg text-gray-700">회원가입 처리 중...</Text>
      </View>
    );
  }

  if (error && !isSuccess) {
    return (
      <View className="flex-1 gap-8 bg-white px-6">
        <View className="mt-44 flex-col items-center justify-center">
          <Image source={gwangsanLogo} style={{ width: 256, height: 256 }} />
          <Text className="text-center text-2xl font-bold text-red-500">
            회원가입 중 {'\n'} 오류가 발생했습니다
          </Text>
          <Text className="mt-4 text-center text-gray-700">{error}</Text>
        </View>
        <View className="mb-8 mt-auto gap-4">
          <Button onPress={handleRetry}>다시 시도</Button>
        </View>
      </View>
    );
  }

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
