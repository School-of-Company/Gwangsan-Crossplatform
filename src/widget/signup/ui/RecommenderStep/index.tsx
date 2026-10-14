import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { AxiosError } from 'axios';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import gwangsanLogo from '@/shared/assets/png/gwangsanLogo.png';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField } from '~/entity/auth/model/useAuthSelectors';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import { signup } from '~/entity/auth/api/signup';
import { Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ZodError } from 'zod';

const SMS_AUTH_EXPIRED_MESSAGE = '전화번호 인증 시간이 지났습니다.\n전화번호를 다시 인증해주세요.';

// 서버는 인증 완료 상태를 10분만 보관한다. 인증 뒤 남은 단계를 채우다 시간이 지나면
// 가입 요청이 "SMS 인증 정보를 찾을 수 없습니다"(404)로 실패한다(#784)
const isSmsAuthExpiredError = (err: unknown) =>
  err instanceof AxiosError && err.response?.status === 404 && /SMS/.test(err.message);

export default function RecommenderStep() {
  const { value: initialRecommender, updateField } = useSignupFormField('recommender');
  const formData = useSignupStore((state) => state.formData);
  const [recommender, setRecommender] = useState(initialRecommender);
  const [error, setError] = useState<string | null>(null);
  const [isSmsAuthExpired, setIsSmsAuthExpired] = useState(false);

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      router.push('/signup/complete');
    },
    onError: (err) => {
      if (isSmsAuthExpiredError(err)) {
        setIsSmsAuthExpired(true);
        return;
      }
      const message = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.';
      Toast.show({
        type: 'error',
        text1: '회원가입 실패',
        // 백엔드가 존재하지 않는 추천인 별칭도 "강제 탈퇴 처리된 회원입니다"로 응답해
        // 추천인 입력 단계에서만 문구를 보정한다.
        text2: message.includes('강제 탈퇴') ? '존재하지 않는 회원입니다.' : message,
      });
    },
  });

  const handleReverify = () => {
    router.replace({ pathname: '/signup/phoneNumber', params: { reverify: 'true' } });
  };

  const validateAndNext = () => {
    try {
      nicknameSchema.parse(recommender);
      setError(null);
      updateField(recommender);
      signupMutation.mutate({ ...formData, recommender });
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('유효하지 않은 별칭입니다');
      }
    }
  };

  const handleRecommenderChange = (text: string) => {
    setRecommender(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (recommender?.trim() !== '') {
      validateAndNext();
    }
  };

  if (isSmsAuthExpired) {
    return (
      <View className="flex-1 gap-8 bg-background px-6">
        <View className="mt-44 flex-col items-center justify-center">
          <Image source={gwangsanLogo} style={{ width: 256, height: 256, borderRadius: 40 }} />
          <Text className="text-center text-2xl font-bold text-red-500">
            {SMS_AUTH_EXPIRED_MESSAGE}
          </Text>
        </View>
        <View className="mb-8 mt-auto">
          <Button onPress={handleReverify}>전화번호 다시 인증하기</Button>
        </View>
      </View>
    );
  }

  return (
    <SignupForm
      title="회원가입"
      description="추천인을 입력해주세요"
      onNext={validateAndNext}
      nextButtonText={signupMutation.isPending ? '가입 중...' : '다음'}
      isNextDisabled={recommender?.trim() === '' || signupMutation.isPending}>
      <View>
        <Input
          label="추천인"
          placeholder="추천인 별칭을 입력해주세요"
          value={recommender}
          onChangeText={handleRecommenderChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          editable={!signupMutation.isPending}
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
