import { useState } from 'react';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SigninForm from '~/entity/auth/ui/SigninForm';
import { useSigninFormField, useSigninStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { passwordSchema } from '~/entity/auth/model/authSchema';
import { signinWithDeviceInfo, saveCredentialsForBiometric } from '~/entity/auth/api/signin';
import { View } from 'react-native';
import { ZodError } from 'zod';
import { router } from 'expo-router';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export default function PasswordStep() {
  const { value: initialPassword, updateField } = useSigninFormField('password');
  const { resetStore } = useSigninStepNavigation();
  const [password, setPassword] = useState<string | undefined>(initialPassword as string);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { value: nickname } = useSigninFormField('nickname');

  const validateAndNext = async () => {
    if (isLoading) return;

    try {
      const trimmedPassword = passwordSchema.parse(password as string);
      const trimmedNickname = nickname as string;

      setError(null);
      updateField(trimmedPassword);
      setIsLoading(true);

      await signinWithDeviceInfo({ nickname: trimmedNickname, password: trimmedPassword });
      saveCredentialsForBiometric(trimmedNickname, trimmedPassword).catch(console.error);

      resetStore();
      router.replace('/main');
    } catch (err) {
      console.error(err);

      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (password?.trim() !== '' && !isLoading) {
      validateAndNext();
    }
  };

  return (
    <SigninForm
      title="로그인"
      description="비밀번호를 입력해주세요"
      onNext={validateAndNext}
      nextButtonText={isLoading ? '로그인 중...' : '로그인'}
      isNextDisabled={password?.trim() === '' || isLoading}>
      <View>
        <PasswordInput
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password as string}
          onChangeText={handlePasswordChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          editable={!isLoading}
        />
        <ErrorMessage error={error} />
      </View>
    </SigninForm>
  );
}
