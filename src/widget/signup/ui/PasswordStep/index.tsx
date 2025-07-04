import { useState, useRef } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { passwordSchema, passwordConfirmSchema } from '~/entity/signup/model/signupSchema';
import { View, TextInput } from 'react-native';
import { ZodError } from 'zod';

export default function PasswordStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [password, setPassword] = useState(formData.password);
  const [passwordConfirm, setPasswordConfirm] = useState(formData.passwordConfirm);
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
      setField('password', password);
      setField('passwordConfirm', passwordConfirm);
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
    if (password.trim() !== '' && passwordConfirm.trim() !== '') {
      validateAndNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="비밀번호를 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={password.trim() === '' || passwordConfirm.trim() === ''}>
      <View>
        <Input
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChangeText={handlePasswordChange}
          onSubmitEditing={handlePasswordSubmit}
          secureTextEntry={true}
          returnKeyType="next"
        />
        <ErrorMessage error={passwordError} />
      </View>

      <View className="mt-4">
        <Input
          ref={passwordConfirmRef}
          label="비밀번호 재입력"
          placeholder="비밀번호를 다시 입력해주세요"
          value={passwordConfirm}
          onChangeText={handleConfirmChange}
          onSubmitEditing={handleConfirmSubmit}
          secureTextEntry={true}
          returnKeyType="done"
        />
        <ErrorMessage error={confirmError} />
      </View>
    </SignupForm>
  );
}
