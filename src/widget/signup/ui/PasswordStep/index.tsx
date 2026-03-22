import { useState, useRef } from 'react';
import { PasswordInput } from '@/shared/ui/PasswordInput';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { passwordSchema, passwordConfirmSchema } from '~/entity/auth/model/authSchema';
import { View, TextInput } from 'react-native';
import { ZodError } from 'zod';

export default function PasswordStep() {
  const { value: initialPassword, updateField: updatePassword } = useSignupFormField('password');
  const { value: initialPasswordConfirm, updateField: updatePasswordConfirm } =
    useSignupFormField('passwordConfirm');
  const { nextStep } = useSignupStepNavigation();

  const [password, setPassword] = useState(initialPassword);
  const [passwordConfirm, setPasswordConfirm] = useState(initialPasswordConfirm);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const passwordConfirmRef = useRef<TextInput>(null);

  const validateAndNext = () => {
    let hasError = false;

    try {
      passwordSchema.parse(password);
      setPasswordError(null);
    } catch (err) {
      if (err instanceof ZodError) {
        setPasswordError(err.errors[0].message);
        hasError = true;
      }
    }

    try {
      passwordConfirmSchema(password).parse(passwordConfirm);
      setConfirmError(null);
    } catch (err) {
      if (err instanceof ZodError) {
        setConfirmError(err.errors[0].message);
        hasError = true;
      }
    }

    if (!hasError) {
      updatePassword(password);
      updatePasswordConfirm(passwordConfirm);
      nextStep();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
  };

  const handleConfirmChange = (text: string) => {
    setPasswordConfirm(text);
    if (confirmError) setConfirmError(null);
  };

  const handlePasswordSubmit = () => {
    passwordConfirmRef.current?.focus();
  };

  const handleConfirmSubmit = () => {
    if (password?.trim() !== '' && passwordConfirm?.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="비밀번호를 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={password?.trim() === '' || passwordConfirm?.trim() === ''}>
      <View>
        <PasswordInput
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChangeText={handlePasswordChange}
          onSubmitEditing={handlePasswordSubmit}
          returnKeyType="next"
        />
        <ErrorMessage error={passwordError} />
      </View>

      <View className="mt-4">
        <PasswordInput
          ref={passwordConfirmRef}
          label="비밀번호 재입력"
          placeholder="비밀번호를 다시 입력해주세요"
          value={passwordConfirm}
          onChangeText={handleConfirmChange}
          onSubmitEditing={handleConfirmSubmit}
          returnKeyType="done"
        />
        <ErrorMessage error={confirmError} />
      </View>
    </SignupForm>
  );
}
