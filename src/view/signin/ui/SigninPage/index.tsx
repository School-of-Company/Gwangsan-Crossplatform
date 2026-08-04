import { memo, useEffect } from 'react';
import { useNavigation } from 'expo-router';
import {
  useSigninCurrentStep,
  useSigninDirection,
  useSigninStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import { NicknameStep, PasswordStep } from '@/widget/signin';
import { SlideFadeTransition } from '@/shared/ui/SlideFadeTransition';
import type { SigninState } from '~/entity/auth/model/authState';

// 푸터 탭 전환(src/app/(tabs)/_layout.tsx의 tabSlideInterpolator)과 동일한 값
const FOOTER_TRANSITION_OFFSET = 32;
const FOOTER_TRANSITION_DURATION = 100;

const STEP_COMPONENTS: Record<SigninState['currentStep'], React.ComponentType> = {
  nickname: NicknameStep,
  password: PasswordStep,
} as const;

function SigninPageView(): React.ReactNode {
  const currentStep = useSigninCurrentStep();
  const direction = useSigninDirection();
  const { prevStep, goToStep } = useSigninStepNavigation();
  const navigation = useNavigation();
  const StepComponent = STEP_COMPONENTS[currentStep];

  // 이전 로그인 시도가 비밀번호 단계에서 중단된 채로 남아있을 수 있으므로,
  // 화면에 새로 진입할 때는 항상 별칭 입력 단계부터 시작한다.
  useEffect(() => {
    if (currentStep !== 'nickname') {
      goToStep('nickname');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (currentStep !== 'password') return;
      e.preventDefault();
      prevStep();
    });
    return unsubscribe;
  }, [navigation, currentStep, prevStep]);

  return (
    <SlideFadeTransition
      key={currentStep}
      direction={direction}
      offset={FOOTER_TRANSITION_OFFSET}
      duration={FOOTER_TRANSITION_DURATION}>
      <StepComponent />
    </SlideFadeTransition>
  );
}

export default memo(SigninPageView);
