import { useCallback, useMemo } from 'react';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { useSigninStore } from '@/shared/store/useSigninStore';
import type { SignupState, SigninState } from './authState';

export function useCurrentStep<TState extends SignupState | SigninState>(
  useStore: (selector: (state: TState) => TState['currentStep']) => TState['currentStep']
): TState['currentStep'] {
  return useStore((state) => state.currentStep);
}

export function useStepNavigation<TState extends SignupState | SigninState>(
  useStore: (selector: (state: TState) => unknown) => unknown
) {
  const nextStep = useStore((state: TState) => state.nextStep) as () => void;
  const prevStep = useStore((state: TState) => state.prevStep) as () => void;
  const goToStep = useStore((state: TState) => state.goToStep) as (
    step: TState['currentStep']
  ) => void;
  const resetStore = useStore((state: TState) => state.resetStore) as () => void;

  return useMemo(
    () => ({ nextStep, prevStep, goToStep, resetStore }),
    [nextStep, prevStep, goToStep, resetStore]
  );
}

export function useFormField<TState extends SignupState | SigninState, K extends string>(
  fieldName: K,
  useStore: (selector: (state: TState) => unknown) => unknown
) {
  const value = useStore((state: TState) => (state.formData as any)[fieldName]);
  const setField = useStore((state: TState) => state.setField) as (
    field: string,
    value: unknown
  ) => void;

  const updateField = useCallback(
    (newValue: unknown) => {
      setField(fieldName, newValue);
    },
    [fieldName, setField]
  );

  return useMemo(() => ({ value, updateField }), [value, updateField]);
}

export const useSignupCurrentStep = () => useCurrentStep<SignupState>(useSignupStore);
export const useSigninCurrentStep = () => useCurrentStep<SigninState>(useSigninStore);

export const useSignupStepNavigation = () => useStepNavigation<SignupState>(useSignupStore);
export const useSigninStepNavigation = () => useStepNavigation<SigninState>(useSigninStore);

export const useSignupFormField = <K extends keyof SignupState['formData']>(fieldName: K) =>
  useFormField<SignupState, K>(fieldName, useSignupStore);

export const useSigninFormField = <K extends keyof SigninState['formData']>(fieldName: K) =>
  useFormField<SigninState, K>(fieldName, useSigninStore);
