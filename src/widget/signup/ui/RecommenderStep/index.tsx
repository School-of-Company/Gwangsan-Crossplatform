import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField } from '~/entity/auth/model/useAuthSelectors';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import { signup } from '~/entity/auth/api/signup';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ZodError } from 'zod';

export default function RecommenderStep() {
  const { value: initialRecommender, updateField } = useSignupFormField('recommender');
  const formData = useSignupStore((state) => state.formData);
  const [recommender, setRecommender] = useState(initialRecommender);
  const [error, setError] = useState<string | null>(null);

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      router.push('/signup/complete');
    },
    onError: (err) => {
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
