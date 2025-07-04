import { useState } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '~/entity/signup/model/useSignupStore';
import { PLACE } from '@/shared/consts/place';
import { View } from 'react-native';

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

  const handlePlaceSelect = (selectedPlace: string) => {
    setPlace(selectedPlace);
    if (error) setError(null);
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
          onSelect={handlePlaceSelect}
          placeholder="지점을 선택해주세요"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
