import React from 'react';
import { render } from '@testing-library/react-native';
import { useSigninCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import SigninPage from '../index';

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSigninCurrentStep: jest.fn(),
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

beforeEach(() => jest.clearAllMocks());

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
});
