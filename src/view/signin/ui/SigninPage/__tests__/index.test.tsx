import React from 'react';
import { render } from '@testing-library/react-native';
import { useNavigation } from 'expo-router';
import {
  useSigninCurrentStep,
  useSigninDirection,
  useSigninStepNavigation,
} from '~/entity/auth/model/useAuthSelectors';
import SigninPage from '../index';

jest.mock('expo-router', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSigninCurrentStep: jest.fn(),
  useSigninDirection: jest.fn(),
  useSigninStepNavigation: jest.fn(),
}));

jest.mock('@/widget/signin', () => ({
  NicknameStep: () => {
    const { Text } = require('react-native');
    return <Text testID="nickname-step">nickname</Text>;
  },
  PasswordStep: () => {
    const { Text } = require('react-native');
    return <Text testID="password-step">password</Text>;
  },
}));

const mockUseSigninCurrentStep = useSigninCurrentStep as jest.Mock;
const mockUseSigninDirection = useSigninDirection as jest.Mock;
const mockUseSigninStepNavigation = useSigninStepNavigation as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;

const mockPrevStep = jest.fn();
const mockGoToStep = jest.fn();
const mockAddListener = jest.fn((_event: string, _handler: (...args: any[]) => void) => jest.fn());

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSigninDirection.mockReturnValue(null);
  mockUseSigninStepNavigation.mockReturnValue({ prevStep: mockPrevStep, goToStep: mockGoToStep });
  mockUseNavigation.mockReturnValue({ addListener: mockAddListener });
});

describe('SigninPage', () => {
  it('currentStep이 nickname이면 NicknameStep을 렌더링한다', () => {
    mockUseSigninCurrentStep.mockReturnValue('nickname');

    const { getByTestId, queryByTestId } = render(<SigninPage />);

    expect(getByTestId('nickname-step')).toBeTruthy();
    expect(queryByTestId('password-step')).toBeNull();
  });

  it('currentStep이 password이면 PasswordStep을 렌더링한다', () => {
    mockUseSigninCurrentStep.mockReturnValue('password');

    const { getByTestId, queryByTestId } = render(<SigninPage />);

    expect(getByTestId('password-step')).toBeTruthy();
    expect(queryByTestId('nickname-step')).toBeNull();
  });

  it('currentStep이 nickname이면 마운트 시 goToStep을 호출하지 않는다', () => {
    mockUseSigninCurrentStep.mockReturnValue('nickname');

    render(<SigninPage />);

    expect(mockGoToStep).not.toHaveBeenCalled();
  });

  it('currentStep이 password로 남아있으면 마운트 시 nickname으로 되돌린다', () => {
    mockUseSigninCurrentStep.mockReturnValue('password');

    render(<SigninPage />);

    expect(mockGoToStep).toHaveBeenCalledWith('nickname');
  });

  it('password 단계에서 뒤로가기(beforeRemove)를 가로채 nickname으로 이동한다', () => {
    mockUseSigninCurrentStep.mockReturnValue('password');

    render(<SigninPage />);

    const beforeRemoveHandler = mockAddListener.mock.calls.find(
      ([eventName]) => eventName === 'beforeRemove'
    )?.[1];
    const preventDefault = jest.fn();

    beforeRemoveHandler?.({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(mockPrevStep).toHaveBeenCalled();
  });

  it('nickname 단계에서는 뒤로가기(beforeRemove)를 가로채지 않는다', () => {
    mockUseSigninCurrentStep.mockReturnValue('nickname');

    render(<SigninPage />);

    const beforeRemoveHandler = mockAddListener.mock.calls.find(
      ([eventName]) => eventName === 'beforeRemove'
    )?.[1];
    const preventDefault = jest.fn();

    beforeRemoveHandler?.({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockPrevStep).not.toHaveBeenCalled();
  });
});
