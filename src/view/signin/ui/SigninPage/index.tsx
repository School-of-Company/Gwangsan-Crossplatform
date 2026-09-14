import { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import {
  useSigninCurrentStep,
  useSigninStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import { NicknameStep, PasswordStep } from '@/widget/signin';
import { getSigninStepIndex } from '~/entity/auth/lib/getStep';
import type { SigninState } from '~/entity/auth/model/authState';

const STEP_COMPONENTS: Record<SigninState['currentStep'], React.ComponentType> = {
  nickname: NicknameStep,
  password: PasswordStep,
} as const;

// 푸터 탭 전환(src/app/(tabs)/_layout.tsx)과 동일한 이동 거리/시간
const STEP_TRANSITION_OFFSET = 32;
const STEP_TRANSITION_DURATION = 100;
const STEP_EASING = Easing.out(Easing.cubic);

// transform.translateX만 직접 애니메이션한다 — Reanimated의 SlideInRight/SlideInLeft는
// transform이 아니라 originX(레이아웃 원점)를 애니메이션하고 기본 이동 거리도 화면 전체
// 너비라, 이런 작은 offset을 주려 하면 무시되고 뒤로가기 방향이 반영되지 않는다.
function buildStepEntering(direction: 'left' | 'right') {
  const translateX = direction === 'right' ? STEP_TRANSITION_OFFSET : -STEP_TRANSITION_OFFSET;
  return () => {
    'worklet';
    return {
      initialValues: { transform: [{ translateX }] },
      animations: {
        transform: [
          {
            translateX: withTiming(0, { duration: STEP_TRANSITION_DURATION, easing: STEP_EASING }),
          },
        ],
      },
    };
  };
}

export default function SigninPageView(): React.ReactNode {
  const currentStep = useSigninCurrentStep();
  const { prevStep, goToStep } = useSigninStepNavigation();
  const navigation = useNavigation();
  const StepComponent = STEP_COMPONENTS[currentStep];

  // 별칭 → 비밀번호로 가면 오른쪽에서, 뒤로가면 왼쪽에서 슬라이드해 들어오도록 스텝 순서를
  // 비교해 방향을 계산한다. 최초 진입(별칭 화면)도 오른쪽에서 들어오도록 기본값은 'right'.
  const [lastStep, setLastStep] = useState(currentStep);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  if (currentStep !== lastStep) {
    setDirection(getSigninStepIndex(currentStep) > getSigninStepIndex(lastStep) ? 'right' : 'left');
    setLastStep(currentStep);
  }

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
    <Animated.View key={currentStep} entering={buildStepEntering(direction)} style={{ flex: 1 }}>
      <StepComponent />
    </Animated.View>
  );
}
