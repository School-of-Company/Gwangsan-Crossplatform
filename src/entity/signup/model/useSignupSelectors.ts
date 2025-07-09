import { useCallback } from 'react';
import { useSignupStore } from '@/shared/store/useSignupStore';
import type { SignupState } from './authState';

export const useCurrentStep = () => {
  return useSignupStore((state) => state.currentStep);
};

export const useFormField = <K extends keyof SignupState['formData']>(fieldName: K) => {
  const value = useSignupStore((state) => state.formData[fieldName]);
  const setField = useSignupStore((state) => state.setField);

  const updateField = useCallback(
    (newValue: SignupState['formData'][K]) => {
      setField(fieldName, newValue);
    },
    [fieldName, setField]
  );

  return { value, updateField };
};

export const useStepNavigation = () => {
  const nextStep = useSignupStore((state) => state.nextStep);
  const prevStep = useSignupStore((state) => state.prevStep);
  const goToStep = useSignupStore((state) => state.goToStep);
  const resetStore = useSignupStore((state) => state.resetStore);

  return { nextStep, prevStep, goToStep, resetStore };
};
