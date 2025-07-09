import { useCallback } from 'react';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { useSigninStore } from '@/shared/store/useSigninStore';
import type { SignupState, SigninState } from './authState';

const createFormFieldHook = <T>(useStore: any) => 
  <K extends keyof T>(fieldName: K) => {
    const value = useStore((state: any) => state.formData[fieldName]);
    const setField = useStore((state: any) => state.setField);

    const updateField = useCallback(
      (newValue: any) => {
        setField(fieldName as string, newValue);
      },
      [fieldName, setField]
    );

    return { value, updateField };
  };

const createStepNavigationHook = (useStore: any) => () => {
  const nextStep = useStore((state: any) => state.nextStep);
  const prevStep = useStore((state: any) => state.prevStep);
  const goToStep = useStore((state: any) => state.goToStep);
  const resetStore = useStore((state: any) => state.resetStore);

  return { nextStep, prevStep, goToStep, resetStore };
};

export const useSignupCurrentStep = (): SignupState['currentStep'] => 
  useSignupStore((state) => state.currentStep);

export const useSignupFormField = createFormFieldHook<SignupState['formData']>(useSignupStore);
export const useSignupStepNavigation = createStepNavigationHook(useSignupStore);

export const useSigninCurrentStep = (): SigninState['currentStep'] => 
  useSigninStore((state) => state.currentStep);

export const useSigninFormField = createFormFieldHook<SigninState['formData']>(useSigninStore);
export const useSigninStepNavigation = createStepNavigationHook(useSigninStore);

export const useCurrentStep = useSignupCurrentStep;
export const useFormField = useSignupFormField;
export const useStepNavigation = useSignupStepNavigation;
