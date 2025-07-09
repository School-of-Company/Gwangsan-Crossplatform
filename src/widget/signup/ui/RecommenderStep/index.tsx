import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useSignupSelectors';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';

export default function RecommenderStep() {
  const { value: initialRecommender, updateField } = useFormField('recommender');
  const { nextStep } = useStepNavigation();
  const [recommender, setRecommender] = useState(initialRecommender);
  const [error, setError] = useState<string | null>(null);

  const validateAndNext = () => {
    try {
      nicknameSchema.parse(recommender);
      setError(null);
      updateField(recommender);
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

  const handleSubmit = () => {
    if (recommender.trim() !== '') {
      validateAndNext();
    }
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
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
