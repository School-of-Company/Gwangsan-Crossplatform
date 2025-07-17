import { useState, memo } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { nameSchema } from '~/entity/auth/model/authSchema';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ZodError } from 'zod';

function NameStep() {
  const { value: initialName, updateField } = useSignupFormField('name');
  const { nextStep, resetStore } = useSignupStepNavigation();
  const [name, setName] = useState<string | undefined>(initialName as string);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    resetStore();
    router.back();
  };

  const validateAndNext = () => {
    try {
      setError(null);
      updateField(nameSchema.parse(name as string));
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('유효하지 않은 이름입니다');
      }
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (name?.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="이름을 입력해주세요"
      onNext={validateAndNext}
      onBack={handleBack}
      isNextDisabled={name?.trim() === ''}>
      <View>
        <Input
          label="이름"
          placeholder="본인의 이름을 입력해주세요"
          value={name as string}
          onChangeText={handleNameChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="next"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}

export default memo(NameStep);
