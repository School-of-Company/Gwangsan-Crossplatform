import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SigninForm from '@/entity/signin/ui/SigninForm';
import { useFormField, useStepNavigation } from '~/entity/signin/model/useSigninSelectors';
import { passwordSchema } from '~/entity/signup/model/authSchema';
import { View } from 'react-native';
import { ZodError } from 'zod';
import { router } from 'expo-router';

export default function PasswordStep() {
  const { value: initialPassword, updateField } = useFormField('password');
  const { resetStore } = useStepNavigation();
  const [password, setPassword] = useState(initialPassword);
  const [error, setError] = useState<string | null>(null);

  const validateAndNext = () => {
    try {
      passwordSchema.parse(password);
      setError(null);
      updateField(password);
      resetStore();
      router.replace('/main');
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('유효하지 않은 비밀번호입니다');
      }
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (password.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SigninForm
      title="로그인"
      description="비밀번호를 입력해주세요"
      onNext={validateAndNext}
      nextButtonText="로그인"
      isNextDisabled={password.trim() === ''}>
      <View>
        <Input
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChangeText={handlePasswordChange}
          onSubmitEditing={handleSubmit}
          secureTextEntry={true}
          returnKeyType="done"
        />
        <ErrorMessage error={error} />
      </View>
    </SigninForm>
  );
}
