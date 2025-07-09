import { useState } from 'react';
import SpecialtiesDropdown from '~/entity/auth/ui/SpecialtiesDropdown';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useFormField, useStepNavigation } from '~/entity/auth/model/useSignupSelectors';
import { View } from 'react-native';
import { SPECIALTIES } from '@/shared/consts/specialties';

export default function SpecialtiesStep() {
  const { value: initialSpecialties, updateField } = useFormField('specialties');
  const { nextStep } = useStepNavigation();

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    Array.isArray(initialSpecialties) ? initialSpecialties : []
  );
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedSpecialties.length === 0) {
      setError('특기를 선택해주세요');
      return;
    }

    updateField(selectedSpecialties);
    nextStep();
  };

  const handleSpecialtiesSelect = (specialties: string[]) => {
    setSelectedSpecialties(specialties);
    if (error && specialties.length > 0) setError(null);
  };

  return (
    <SignupForm
      title="회원가입"
      description="자신의 특기를 선택해주세요"
      onNext={handleNext}
      isNextDisabled={selectedSpecialties.length === 0}>
      <View className="w-full">
        <SpecialtiesDropdown
          items={SPECIALTIES}
          selectedItems={selectedSpecialties}
          onSelect={handleSpecialtiesSelect}
          placeholder="특기를 선택해주세요"
          allowCustomInput={true}
        />
        <ErrorMessage error={error} className="mt-2 h-6" />
      </View>
    </SignupForm>
  );
}
