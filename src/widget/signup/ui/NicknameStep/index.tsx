import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '@/entity/signup/model/signupStore';

export default function NicknameStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [nickname, setNickname] = useState(formData.nickname);
  
  const handleNext = () => {
    if (nickname.trim() === '') return;
    setField('nickname', nickname);
    nextStep();
  };
  
  return (
    <SignupForm
      title="회원가입"
      description="이름을 입력해주세요"
      onNext={handleNext}
      isNextDisabled={nickname.trim() === ''}
    >
      <Input
        label="별칭"
        placeholder="별칭을 입력해주세요"
        value={nickname}
        onChangeText={setNickname}
      />
    </SignupForm>
  );
}