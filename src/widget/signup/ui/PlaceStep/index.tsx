import { useState } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { PLACE } from '@/shared/consts/place';
import { Text, View } from 'react-native';

export default function PlaceStep() {
  const { formData, setField, nextStep } = useSignupStore();
  const [place, setPlace] = useState(formData.place);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (place.trim() === '') {
      setError('지점을 선택해주세요');
      return;
    }
    setField('place', place);
    nextStep();
  };

  return (
    <SignupForm
      title="회원가입"
      description="지점을 선택해주세요"
      onNext={handleNext}
      isNextDisabled={place.trim() === ''}>
      <View>
        <Dropdown
          items={PLACE}
          selectedItem={place}
          onSelect={setPlace}
          placeholder="지점을 선택해주세요"
        />
        <View className="h-6">{error && <Text className="text-red-500">{error}</Text>}</View>
      </View>
    </SignupForm>
  );
}
