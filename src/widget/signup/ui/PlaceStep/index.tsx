import { useState } from 'react';
import { Dropdown } from '@/shared/ui/Dropdown';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField } from '~/entity/auth/model/useAuthSelectors';
import { PLACE_ITEMS } from '@/shared/consts/place';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function PlaceStep() {
  const { value: initialPlaceId, updateField } = useSignupFormField('placeId');
  const [placeIdStr, setPlaceIdStr] = useState<string | undefined>(
    initialPlaceId ? String(initialPlaceId) : undefined
  );
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!placeIdStr) {
      setError('지점을 선택해주세요');
      return;
    }
    updateField(parseInt(placeIdStr, 10));
    router.push('/signup/specialties');
  };

  const handlePlaceSelect = (selectedPlaceIdStr: string) => {
    setPlaceIdStr(selectedPlaceIdStr);
    if (error) setError(null);
  };

  const dropdownItems = PLACE_ITEMS.map((item) => ({
    value: String(item.id),
    label: item.name,
  }));

  return (
    <SignupForm
      title="회원가입"
      description="지점을 선택해주세요"
      onNext={handleNext}
      isNextDisabled={!placeIdStr}>
      <View>
        <Dropdown
          items={dropdownItems}
          selectedItem={placeIdStr}
          onSelect={handlePlaceSelect}
          placeholder="지점을 선택해주세요"
        />
        <ErrorMessage error={error} />
      </View>
    </SignupForm>
  );
}
