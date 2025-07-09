import { useState } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { PLACE } from '@/shared/consts/place';
import { View } from 'react-native';

export default function PlaceStep() {
  const { value: initialPlace, updateField } = useFormField('place');
  const { nextStep } = useStepNavigation();
  const [place, setPlace] = useState(initialPlace);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (place.trim() === '') {
      setError('지점을 선택해주세요');
      return;
    }
    updateField(place);
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
