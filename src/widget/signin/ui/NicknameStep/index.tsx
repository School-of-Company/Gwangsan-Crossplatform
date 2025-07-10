import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SigninForm from '~/entity/auth/ui/SigninForm';
import { useSigninFormField, useSigninStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';
import { router } from 'expo-router';

export default function NicknameStep() {
  const { value: initialNickname, updateField } = useSigninFormField('nickname');
  const { nextStep, resetStore } = useSigninStepNavigation();
  const [nickname, setNickname] = useState<string | undefined>(initialNickname as string);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    resetStore();
    router.replace('/onboarding');
  };

  const validateAndNext = () => {
    try {
      nicknameSchema.parse(nickname);
      setError(null);
      updateField(nickname);
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

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (nickname?.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SigninForm
      title="로그인"
      description="별칭을 입력해주세요"
      onNext={validateAndNext}
      onBack={handleBack}
      isNextDisabled={nickname?.trim() === ''}>
      <View>
        <Input
          label="별칭"
          placeholder="별칭을 입력해주세요"
          value={nickname as string}
          onChangeText={handleNicknameChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="next"
        />
        <ErrorMessage error={error} />
      </View>
    </SigninForm>
  );
}
