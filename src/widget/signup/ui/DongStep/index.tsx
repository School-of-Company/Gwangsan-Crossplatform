import { useState, useMemo } from 'react';
import { Input } from '@/shared/ui/Input';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupFormField, useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { SearchIcon } from '@/shared/assets/svg/SearchIcon';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { DONG } from '@/shared/consts/dong';

export default function DongStep() {
  const { value: initialDongName, updateField } = useSignupFormField('dongName');
  const { nextStep } = useSignupStepNavigation();
  const [searchText, setSearchText] = useState('');
  const [dongName, setDongName] = useState(initialDongName);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const filteredDongs = useMemo(() => {
    if (!searchText.trim()) return [];

    return DONG.filter((item) => item.toLowerCase().includes(searchText.toLowerCase()));
  }, [searchText]);

  const handleSelectDong = (selectedDong: string) => {
    setDongName(selectedDong);
    setSearchText(selectedDong);
    setShowResults(false);
    if (error) setError(null);
  };

  const handleNext = () => {
    if (dongName.trim() === '') {
      setError('동네를 입력해주세요');
      return;
    }
    updateField(dongName);
    nextStep();
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (error) setError(null);
    setShowResults(true);
    if (text !== dongName) {
      setDongName('');
    }
  };

  const handleSearchSubmit = () => {
    if (filteredDongs.length === 1) {
      handleSelectDong(filteredDongs[0]);
    } else if (filteredDongs.length > 1) {
      setShowResults(true);
    }
  };

  return (
    <SignupForm
      title="회원가입"
      description="동네를 선택해주세요"
      onNext={handleNext}
      isNextDisabled={dongName.trim() === ''}>
      <View>
        <Input
          label=""
          placeholder="동네를 검색해주세요"
          value={searchText}
          onChangeText={handleSearchChange}
          onSubmitEditing={handleSearchSubmit}
          icon={<SearchIcon />}
          onFocus={() => setShowResults(true)}
          returnKeyType="search"
        />

        {showResults && filteredDongs.length > 0 && (
          <ScrollView
            className="mt-8 max-h-60 border-t border-[#EFF0F2]"
            keyboardShouldPersistTaps="handled">
            {filteredDongs.map((item, index) => (
              <TouchableOpacity
                key={item}
                className={`border-b border-[#EFF0F2] px-4 py-8 ${
                  index === filteredDongs.length - 1 ? 'border-b-0' : ''
                }`}
                onPress={() => handleSelectDong(item)}>
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ErrorMessage error={error} className="mt-2 h-6" />
      </View>
    </SignupForm>
  );
}
