import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { nicknameSchema } from '~/entity/signup/model/signupSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';

export default function RecommenderStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [recommender, setRecommender] = useState(formData.recommender);
  const [error, setError] = useState<string | null>(null);

  const validateAndNext = () => {
    try {
      nicknameSchema.parse(recommender);
      setError(null);
      setField('recommender', recommender);
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
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

  return (
    <SignupForm
      title="회원가입"
      description="별칭을 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={recommender.trim() === ''}>
      <View>
        <Input
          label="추천인"
          placeholder="추천인 별칭을 입력해주세요"
          value={recommender}
          onChangeText={handleRecommenderChange}
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
