import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function NameStep() {
  const { formData, setField, nextStep, resetStore } = useSignupStore();
  const [name, setName] = useState(formData.name);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    resetStore();
    router.back();
  };

  const handleNext = () => {
    if (name.trim() === '') {
      setError('이름을 입력해주세요');
      return;
    }
    setField('name', name);
    nextStep();
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (error) setError(null);
  };

  const handleSubmit = () => {
    if (name.trim() !== '') {
      handleNext();
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="이름을 입력해주세요"
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={name.trim() === ''}>
      <View>
        <Input
          label="이름"
          placeholder="본인의 이름을 입력해주세요"
          value={name}
          onChangeText={handleNameChange}
          onSubmitEditing={handleSubmit}
          returnKeyType="next"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
