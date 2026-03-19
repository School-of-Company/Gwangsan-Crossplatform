import { useState, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { router } from 'expo-router';
import CheckIcon from '@/shared/assets/svg/CheckIcon';

const TERMS_CONTENT = `■ 부적절한 콘텐츠 금지

광산크로스는 사용자 생성 콘텐츠(UGC)를 포함한 서비스로, 다음과 같은 콘텐츠를 엄격히 금지합니다.

• 성적이거나 음란한 콘텐츠
• 혐오 발언, 괴롭힘, 위협적인 콘텐츠
• 스팸 또는 허위 광고
• 타인을 사칭하는 행위
• 자해 또는 위험을 조장하는 콘텐츠
• 개인정보 침해 콘텐츠

■ 무관용 정책

위반 사항이 확인될 경우 사전 경고 없이 콘텐츠 삭제 및 계정 정지 조치가 취해질 수 있습니다. 신고된 콘텐츠는 24시간 이내에 검토되며, 위반 사용자는 서비스에서 퇴출될 수 있습니다.

■ 차단 및 신고 기능

부적절한 사용자를 차단하거나 신고할 수 있으며, 차단 시 해당 사용자의 콘텐츠는 즉시 피드에서 제거됩니다.

■ 동의 사항

본 약관에 동의함으로써 위의 정책을 숙지하고 준수할 것을 확인합니다.`;

function TermsStep() {
  const { nextStep, resetStore } = useSignupStepNavigation();
  const [agreed, setAgreed] = useState(false);

  const handleBack = () => {
    resetStore();
    router.back();
  };

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
          onPress={() => setAgreed((prev) => !prev)}
          activeOpacity={0.7}>
          <View
            className={`h-6 w-6 items-center justify-center rounded border-2 ${
              agreed ? 'border-primary-500 bg-primary-500' : 'border-gray-300 bg-white'
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
