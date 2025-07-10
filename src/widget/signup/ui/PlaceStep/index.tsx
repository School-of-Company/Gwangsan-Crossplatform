import { useState } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { PLACE } from '@/shared/consts/place';
import { View } from 'react-native';

export default function PlaceStep() {
  const { value: initialPlaceName, updateField } = useFormField('placeName');
  const { nextStep } = useStepNavigation();
  const [placeName, setPlaceName] = useState(initialPlaceName);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (placeName.trim() === '') {
      setError('지점을 선택해주세요');
      return;
    }
    updateField(placeName);
    nextStep();
  };

  const handlePlaceSelect = (selectedPlace: string) => {
    setPlaceName(selectedPlace);
    if (error) setError(null);
  };

  return (
    <SignupForm
      title="회원가입"
      description="지점을 선택해주세요"
      onNext={handleNext}
      isNextDisabled={placeName.trim() === ''}>
      <View>
        <Dropdown
          items={PLACE}
          selectedItem={placeName}
          onSelect={handlePlaceSelect}
          placeholder="지점을 선택해주세요"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
