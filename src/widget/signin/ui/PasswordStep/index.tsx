import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SigninForm from '~/entity/auth/ui/SigninForm';
import { useSigninFormField, useSigninStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { passwordSchema } from '~/entity/auth/model/authSchema';
import { signinWithDeviceInfo } from '~/entity/auth/api/signin';
import { View } from 'react-native';
import { ZodError } from 'zod';
import { router } from 'expo-router';

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
      passwordSchema.parse(password as string);
      setError(null);
      updateField(password as string);

      setIsLoading(true);

      await signinWithDeviceInfo({
        nickname: nickname as string,
        password: password as string,
      });

      resetStore();
      router.replace('/main');
    } catch (err) {
      console.error('로그인 실패:', err);

      if (err instanceof ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
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
        <Input
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password as string}
          onChangeText={handlePasswordChange}
          onSubmitEditing={handleSubmit}
          secureTextEntry={true}
          returnKeyType="done"
          editable={!isLoading}
        />
        <ErrorMessage error={error} />
      </View>
    </SigninForm>
  );
}
