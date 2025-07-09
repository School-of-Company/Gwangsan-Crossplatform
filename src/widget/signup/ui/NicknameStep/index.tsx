import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useSignupSelectors';
import { nicknameSchema } from '~/entity/auth/model/authSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';

export default function NicknameStep() {
  const { value: initialNickname, updateField } = useFormField('nickname');
  const { nextStep } = useStepNavigation();
  const [nickname, setNickname] = useState(initialNickname);
  const [error, setError] = useState<string | null>(null);

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
    if (nickname.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="별칭을 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={nickname.trim() === ''}>
      <View>
        <Input
          label="별칭"
          placeholder="별칭을 입력해주세요"
          value={nickname}
          onChangeText={handleNicknameChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="next"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
