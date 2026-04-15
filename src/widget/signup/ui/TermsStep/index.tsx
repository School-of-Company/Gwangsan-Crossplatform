import { useState, memo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { router } from 'expo-router';
import CheckIcon from '@/shared/assets/svg/CheckIcon';
import { TERMS_CONTENT } from '../../const/TERMS_CONTENT';

function TermsStep() {
  const { nextStep, resetStore } = useSignupStepNavigation();
  const [agreed, setAgreed] = useState(false);

  const handleBack = useCallback(() => {
    resetStore();
    router.back();
  }, [resetStore]);

  const toggleAgreed = useCallback(() => setAgreed((prev) => !prev), []);

  return (
    <SignupForm
      title="이용약관"
      description="서비스 이용을 위해 약관에 동의해주세요"
      onNext={nextStep}
      onBack={handleBack}
      nextButtonText="동의하고 계속"
      isNextDisabled={!agreed}>
      <View className="flex-1 gap-4">
        <View className="h-80 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-sm leading-6 text-gray-700">{TERMS_CONTENT}</Text>
          </ScrollView>
        </View>

        <TouchableOpacity
          className="flex-row items-center gap-3"
          onPress={toggleAgreed}
          activeOpacity={0.7}>
          <View
            className={`h-6 w-6 items-center justify-center rounded border-2 ${
              agreed ? 'border-main-500 bg-main-500' : 'border-gray-300 bg-white'
            }`}>
            {agreed && <CheckIcon color="#ffffff" width={14} height={14} />}
          </View>
          <Text className="flex-1 text-sm text-gray-800">
            위 이용약관 및 무관용 정책에 동의합니다
          </Text>
        </TouchableOpacity>
      </View>
    </SignupForm>
  );
}

export default memo(TermsStep);
