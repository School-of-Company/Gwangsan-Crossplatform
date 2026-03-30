import { renderHook, act } from '@testing-library/react-native';
import { useSignupStore } from '@/shared/store/useSignupStore';
import { useSigninStore } from '@/shared/store/useSigninStore';
import { useResetPasswordStore } from '@/shared/store/useResetPasswordStore';
import {
  useCurrentStep,
  useStepNavigation,
  useFormField,
  useSignupCurrentStep,
  useSigninCurrentStep,
  useResetPasswordCurrentStep,
  useSignupStepNavigation,
  useSigninStepNavigation,
  useResetPasswordStepNavigation,
  useSignupFormField,
  useSigninFormField,
  useResetPasswordFormField,
} from '../useAuthSelectors';
import type { SignupState, SigninState, ResetPasswordState } from '../authState';

jest.mock('@/shared/store/useSignupStore', () => ({
  useSignupStore: jest.fn(),
}));
jest.mock('@/shared/store/useSigninStore', () => ({
  useSigninStore: jest.fn(),
}));
jest.mock('@/shared/store/useResetPasswordStore', () => ({
  useResetPasswordStore: jest.fn(),
}));

const mockUseSignupStore = useSignupStore as jest.Mock;
const mockUseSigninStore = useSigninStore as jest.Mock;
const mockUseResetPasswordStore = useResetPasswordStore as jest.Mock;

const mockSignupState: SignupState = {
  currentStep: 'terms',
  formData: {
    name: '홍길동',
    nickname: 'gildong',
    password: 'pass1!',
    passwordConfirm: 'pass1!',
    phoneNumber: '01012345678',
    verificationCode: '123456',
    dongName: '광산동',
    placeId: 1,
    specialties: ['운동'],
    description: '소개',
    recommender: '',
  },
  setField: jest.fn(),
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  goToStep: jest.fn(),
  resetStore: jest.fn(),
};

const mockSigninState: SigninState = {
  currentStep: 'nickname',
  formData: {
    nickname: 'user',
    password: 'pass',
    deviceToken: 'token',
    deviceId: 'id',
    osType: 'IOS',
  },
  setField: jest.fn(),
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  goToStep: jest.fn(),
  resetStore: jest.fn(),
};

const mockResetState: ResetPasswordState = {
  currentStep: 'phoneNumber',
  formData: {
    phoneNumber: '01012345678',
    verificationCode: '123456',
    newPassword: 'new1!',
    newPasswordConfirm: 'new1!',
  },
  setField: jest.fn(),
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  goToStep: jest.fn(),
  resetStore: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSignupStore.mockImplementation((selector: (s: SignupState) => unknown) =>
    selector(mockSignupState)
  );
  mockUseSigninStore.mockImplementation((selector: (s: SigninState) => unknown) =>
    selector(mockSigninState)
  );
  mockUseResetPasswordStore.mockImplementation((selector: (s: ResetPasswordState) => unknown) =>
    selector(mockResetState)
  );
});

describe('useCurrentStep', () => {
  it('스토어에서 currentStep을 반환한다', () => {
    const { result } = renderHook(() =>
      useCurrentStep<SignupState>((sel) => mockUseSignupStore(sel))
    );
    expect(result.current).toBe('terms');
  });
});

describe('useStepNavigation', () => {
  it('nextStep, prevStep, goToStep, resetStore를 반환한다', () => {
    const { result } = renderHook(() =>
      useStepNavigation<SignupState>((sel) => mockUseSignupStore(sel))
    );

    expect(typeof result.current.nextStep).toBe('function');
    expect(typeof result.current.prevStep).toBe('function');
    expect(typeof result.current.goToStep).toBe('function');
    expect(typeof result.current.resetStore).toBe('function');
  });

  it('nextStep을 호출하면 스토어의 nextStep이 실행된다', () => {
    const { result } = renderHook(() =>
      useStepNavigation<SignupState>((sel) => mockUseSignupStore(sel))
    );

    act(() => {
      result.current.nextStep();
    });

    expect(mockSignupState.nextStep).toHaveBeenCalled();
  });
});

describe('useFormField', () => {
  it('필드 값과 updateField를 반환한다', () => {
    const { result } = renderHook(() =>
      useFormField<SignupState, 'name'>('name', (sel) => mockUseSignupStore(sel))
    );

    expect(result.current.value).toBe('홍길동');
    expect(typeof result.current.updateField).toBe('function');
  });

  it('updateField 호출 시 setField가 실행된다', () => {
    const { result } = renderHook(() =>
      useFormField<SignupState, 'name'>('name', (sel) => mockUseSignupStore(sel))
    );

    act(() => {
      result.current.updateField('김철수');
    });

    expect(mockSignupState.setField).toHaveBeenCalledWith('name', '김철수');
  });
});

describe('convenience hooks', () => {
  it('useSignupCurrentStep은 signup store의 currentStep을 반환한다', () => {
    const { result } = renderHook(() => useSignupCurrentStep());
    expect(result.current).toBe('terms');
  });

  it('useSigninCurrentStep은 signin store의 currentStep을 반환한다', () => {
    const { result } = renderHook(() => useSigninCurrentStep());
    expect(result.current).toBe('nickname');
  });

  it('useResetPasswordCurrentStep은 reset store의 currentStep을 반환한다', () => {
    const { result } = renderHook(() => useResetPasswordCurrentStep());
    expect(result.current).toBe('phoneNumber');
  });

  it('useSignupStepNavigation은 signup store의 네비게이션 함수를 반환한다', () => {
    const { result } = renderHook(() => useSignupStepNavigation());
    act(() => result.current.prevStep());
    expect(mockSignupState.prevStep).toHaveBeenCalled();
  });

  it('useSigninStepNavigation은 signin store의 네비게이션 함수를 반환한다', () => {
    const { result } = renderHook(() => useSigninStepNavigation());
    act(() => result.current.goToStep('password'));
    expect(mockSigninState.goToStep).toHaveBeenCalledWith('password');
  });

  it('useResetPasswordStepNavigation은 reset store의 네비게이션 함수를 반환한다', () => {
    const { result } = renderHook(() => useResetPasswordStepNavigation());
    act(() => result.current.resetStore());
    expect(mockResetState.resetStore).toHaveBeenCalled();
  });

  it('useSignupFormField는 signup store의 필드 값을 반환한다', () => {
    const { result } = renderHook(() => useSignupFormField('nickname'));
    expect(result.current.value).toBe('gildong');
  });

  it('useSigninFormField는 signin store의 필드 값을 반환한다', () => {
    const { result } = renderHook(() => useSigninFormField('nickname'));
    expect(result.current.value).toBe('user');
  });

  it('useResetPasswordFormField는 reset store의 필드 값을 반환한다', () => {
    const { result } = renderHook(() => useResetPasswordFormField('newPassword'));
    expect(result.current.value).toBe('new1!');
  });
});
