import { useCallback } from 'react';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { useSigninStore } from '@/shared/store/useSigninStore';
import type { SignupState, SigninState } from './authState';

export function useSignupFormField<K extends keyof SignupState['formData']>(
  fieldName: K
) {
  const value = useSignupStore((state) => state.formData[fieldName]);
  const setField = useSignupStore((state) => state.setField);

  const updateField = useCallback(
    (newValue: SignupState['formData'][K]) => {
      setField(fieldName as string, newValue);
    },
    [fieldName, setField]
  );

  return { value, updateField };
}

export function useSignupStepNavigation() {
  const nextStep = useSignupStore((state) => state.nextStep);
  const prevStep = useSignupStore((state) => state.prevStep);
  const goToStep = useSignupStore((state) => state.goToStep);
  const resetStore = useSignupStore((state) => state.resetStore);

  return { nextStep, prevStep, goToStep, resetStore };
}

export function useSigninFormField<K extends keyof SigninState['formData']>(
  fieldName: K
) {
  const value = useSigninStore((state) => state.formData[fieldName]);
  const setField = useSigninStore((state) => state.setField);

  const updateField = useCallback(
    (newValue: SigninState['formData'][K]) => {
      setField(fieldName as string, newValue as string);
    },
    [fieldName, setField]
  );

  return { value, updateField };
}

export function useSigninStepNavigation() {
  const nextStep = useSigninStore((state) => state.nextStep);
  const prevStep = useSigninStore((state) => state.prevStep);
  const goToStep = useSigninStore((state) => state.goToStep);
  const resetStore = useSigninStore((state) => state.resetStore);

  return { nextStep, prevStep, goToStep, resetStore };
}

export const useSignupCurrentStep = (): SignupState['currentStep'] =>
  useSignupStore((state) => state.currentStep);

export const useSigninCurrentStep = (): SigninState['currentStep'] =>
  useSigninStore((state) => state.currentStep);

export const useCurrentStep = useSignupCurrentStep;
export const useFormField = useSignupFormField;
export const useStepNavigation = useSignupStepNavigation;
