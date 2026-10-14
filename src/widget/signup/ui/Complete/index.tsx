import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { Button } from '@/shared/ui/Button';
import gwangsanLogo from '@/shared/assets/png/gwangsanLogo.png';
import { router } from 'expo-router';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { signup } from '~/entity/auth/api/signup';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { AxiosError } from 'axios';

const SMS_AUTH_EXPIRED_MESSAGE = '전화번호 인증 시간이 지났습니다.\n전화번호를 다시 인증해주세요.';

// 서버는 인증 완료 상태를 10분만 보관한다. 인증 뒤 남은 단계를 채우다 시간이 지나면
// 가입 요청이 "SMS 인증 정보를 찾을 수 없습니다"(404)로 실패한다(#784)
const isSmsAuthExpiredError = (err: unknown) =>
  err instanceof AxiosError && err.response?.status === 404 && /SMS/.test(err.message);

export default function Complete() {
  const { formData, resetStore } = useSignupStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSmsAuthExpired, setIsSmsAuthExpired] = useState(false);
  const hasSubmittedRef = useRef(false);

  const handleSignup = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

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
      const smsAuthExpired = isSmsAuthExpiredError(err);
      setIsSmsAuthExpired(smsAuthExpired);
      const errorMessage = smsAuthExpired ? SMS_AUTH_EXPIRED_MESSAGE : getErrorMessage(err);
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: '회원가입 실패',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleSignup();
  }, [handleSignup]);

  const handleNext = () => {
    router.navigate('/signin/nickname');
    resetStore();
  };

  const handleRetry = () => {
    hasSubmittedRef.current = false;
    setError(null);
    router.replace('/signup/recommender');
  };

  // 입력했던 정보는 그대로 두고 전화번호만 다시 인증한 뒤 곧바로 가입을 재요청한다
  const handleReverify = () => {
    hasSubmittedRef.current = false;
    setError(null);
    router.replace({ pathname: '/signup/phoneNumber', params: { reverify: 'true' } });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" color="#0075C2" />
        <Text className="mt-4 text-lg text-gray-700">회원가입 처리 중...</Text>
      </View>
    );
  }

  if (error && !isSuccess) {
    return (
      <View className="flex-1 gap-8 bg-background px-6">
        <View className="mt-44 flex-col items-center justify-center">
          {/* 로고 이미지가 흰 배경을 포함하고 있어, 다크 모드에서 흰 사각형 대신 둥근 타일로 보이게 한다 */}
          <Image source={gwangsanLogo} style={{ width: 256, height: 256, borderRadius: 40 }} />
          <Text className="text-center text-2xl font-bold text-red-500">
            회원가입 중 {'\n'} 오류가 발생했습니다
          </Text>
          <Text className="mt-4 text-center text-gray-700">{error}</Text>
        </View>
        <View className="mb-8 mt-auto gap-4">
          {isSmsAuthExpired ? (
            <Button onPress={handleReverify}>전화번호 다시 인증하기</Button>
          ) : (
            <Button onPress={handleRetry}>다시 시도</Button>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 gap-8 bg-background px-6">
      <View className="mt-44 flex-col items-center justify-center">
        {/* 로고 이미지가 흰 배경을 포함하고 있어, 다크 모드에서 흰 사각형 대신 둥근 타일로 보이게 한다 */}
        <Image source={gwangsanLogo} style={{ width: 256, height: 256, borderRadius: 40 }} />
        <Text className="text-center text-2xl font-bold text-sub-500">
          회원가입이 {'\n'} 완료되었습니다
        </Text>
      </View>
      <View className="mb-8 mt-auto">
        <Button onPress={handleNext}>로그인 페이지로 돌아가기</Button>
      </View>
    </View>
  );
}
