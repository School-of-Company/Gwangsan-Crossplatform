import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { passwordSchema, passwordConfirmSchema } from '~/entity/signup/model/signupSchema';
import { Text, View } from 'react-native';
import { ZodError } from 'zod';

export default function PasswordStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [password, setPassword] = useState(formData.password);
  const [passwordConfirm, setPasswordConfirm] = useState(formData.passwordConfirm);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  
  const validateAndNext = () => {
    try {
      passwordSchema.parse(password);
      setPasswordError(null);
      
      passwordConfirmSchema(password).parse(passwordConfirm);
      setConfirmError(null);
      
      setField('password', password);
      setField('passwordConfirm', passwordConfirm);
      nextStep();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessage = err.errors[0].message;
        
        if (err.errors[0].path[0] === 'passwordConfirm') {
          setConfirmError(errorMessage);
        } else {
          setPasswordError(errorMessage);
        }
      } else if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('유효하지 않은 비밀번호입니다');
      }
    }
  };
  
  return (
    <SignupForm
      title="회원가입"
      description="비밀번호를 입력해주세요"
      onNext={validateAndNext}
      isNextDisabled={password.trim() === '' || passwordConfirm.trim() === ''}
    >
      <View>
        <Input
          label="비밀번호"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(null);
          }}
          secureTextEntry={true}
        />
        <View className="h-6">
          {passwordError && (
            <Text className="text-red-500">{passwordError}</Text>
          )}
        </View>
      </View>
      
      <View className="mt-4">
        <Input
          label="비밀번호 재입력"
          placeholder="비밀번호를 다시 입력해주세요"
          value={passwordConfirm}
          onChangeText={(text) => {
            setPasswordConfirm(text);
            setConfirmError(null);
          }}
          secureTextEntry={true}
        />
        <View className="h-6">
          {confirmError && (
            <Text className="text-red-500">{confirmError}</Text>
          )}
        </View>
      </View>
    </SignupForm>
  );
}