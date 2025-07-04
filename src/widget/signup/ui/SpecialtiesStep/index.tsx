import { useState } from 'react';
import SpecialtiesDropdown from '@/entity/signup/ui/SpecialtiesDropdown';
import SignupForm from '@/entity/signup/ui/SignupForm';
import { useSignupStore } from '@/entity/signup/model/useSignupStore';
import { Text, View } from 'react-native';

const SPECIALTIES = ['빨래하기', '벌레잡기', '청소하기', '운전하기', '달리기', '이삿짐 나르기'];

export default function SpecialtiesStep() {
  const { formData, setField, nextStep } = useSignupStore();

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    Array.isArray(formData.specialties) ? formData.specialties : []
  );
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (selectedSpecialties.length === 0) {
      setError('특기를 선택해주세요');
      return;
    }

    setField('specialties', selectedSpecialties);
    nextStep();
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
          onSelect={setSelectedSpecialties}
          placeholder="특기를 선택해주세요"
          allowCustomInput={true}
        />
        <View className="mt-2 h-6">{error && <Text className="text-red-500">{error}</Text>}</View>
      </View>
    </SignupForm>
  );
}
