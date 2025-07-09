import { useCallback } from 'react';
import { useSigninStore } from '@/shared/store/useSigninStore';
import type { SigninState } from '~/entity/signup/model/authState';

export const useCurrentStep = (): SigninState['currentStep'] => {
  return useSigninStore((state) => state.currentStep);
};

export const useFormField = <K extends keyof SigninState['formData']>(fieldName: K) => {
  const value = useSigninStore((state) => state.formData[fieldName]);
  const setField = useSigninStore((state) => state.setField);

  const updateField = useCallback(
    (newValue: SigninState['formData'][K]) => {
      setField(fieldName, newValue);
    },
    [fieldName, setField]
  );

  return { value, updateField };
};

export const useStepNavigation = () => {
  const nextStep = useSigninStore((state) => state.nextStep);
  const prevStep = useSigninStore((state) => state.prevStep);
  const goToStep = useSigninStore((state) => state.goToStep);
  const resetStore = useSigninStore((state) => state.resetStore);

  return { nextStep, prevStep, goToStep, resetStore };
};
