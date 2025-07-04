import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '@/entity/signup/model/signupStore';

export default function NicknameStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [password, setPassword] = useState(formData.password);
  const [passwordConfirm, setPasswordConfirm] = useState(formData.passwordConfirm);
  
  const handleNext = () => {
    if (password.trim() === '' || passwordConfirm.trim() === '') return;
    setField('password', password);
    setField('passwordConfirm', passwordConfirm);
    nextStep();
  };
  
  return (
    <SignupForm
      title="회원가입"
      description="비밀번호를 입력해주세요"
      onNext={handleNext}
      isNextDisabled={password.trim() === '' || passwordConfirm.trim() === ''}
    >
      <Input
        label="비밀번호"
        placeholder="비밀번호를 입력해주세요"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <Input
        label="비밀번호 재입력"
        placeholder="비밀번호를 다시 입력해주세요"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry={true}
      />
    </SignupForm>
  );
}