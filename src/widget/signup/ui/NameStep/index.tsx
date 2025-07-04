import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { Text, View } from 'react-native';
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
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
        />
        <View className="h-6">{error && <Text className="text-red-500">{error}</Text>}</View>
      </View>
    </SignupForm>
  );
}
