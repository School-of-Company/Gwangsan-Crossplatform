import React from 'react';
import { render } from '@testing-library/react-native';
import { useResetPasswordCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import ResetPasswordPage from '../index';

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useResetPasswordCurrentStep: jest.fn(),
}));

jest.mock('@/widget/resetPassword', () => ({
  PhoneStep: () => {
    const { Text } = require('react-native');
    return <Text testID="phone-step">phone</Text>;
  },
  NewPasswordStep: () => {
    const { Text } = require('react-native');
    return <Text testID="new-password-step">newPassword</Text>;
  },
}));

const mockUseResetPasswordCurrentStep = useResetPasswordCurrentStep as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('ResetPasswordPage', () => {
  it('currentStep이 phoneNumber이면 PhoneStep을 렌더링한다', () => {
    mockUseResetPasswordCurrentStep.mockReturnValue('phoneNumber');

    const { getByTestId, queryByTestId } = render(<ResetPasswordPage />);

    expect(getByTestId('phone-step')).toBeTruthy();
    expect(queryByTestId('new-password-step')).toBeNull();
  });

  it('currentStep이 newPassword이면 NewPasswordStep을 렌더링한다', () => {
    mockUseResetPasswordCurrentStep.mockReturnValue('newPassword');

    const { getByTestId, queryByTestId } = render(<ResetPasswordPage />);

    expect(getByTestId('new-password-step')).toBeTruthy();
    expect(queryByTestId('phone-step')).toBeNull();
  });
});
