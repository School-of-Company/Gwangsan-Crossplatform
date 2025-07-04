import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '@/entity/signup/model/signupStore';

export default function NameStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [name, setName] = useState(formData.name);
  
  const handleNext = () => {
    if (name.trim() === '') return;
    setField('name', name);
    nextStep();
  };
  
  return (
    <SignupForm
      title="회원가입"
      description="이름을 입력해주세요"
      onNext={handleNext}
      isNextDisabled={name.trim() === ''}
    >
      <Input
        label="이름"
        placeholder="본인의 이름을 입력해주세요"
        value={name}
        onChangeText={setName}
      />
    </SignupForm>
  );
}