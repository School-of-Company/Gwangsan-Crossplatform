import React from 'react';
import { render } from '@testing-library/react-native';
import OnboardingPage from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('~/entity/onboarding', () => ({
  AuthButtonContainer: () => {
    const { View } = require('react-native');
    return <View testID="auth-button-container" />;
  },
}));

jest.mock('~/widget/onboarding', () => ({
  OnboardingSlideViewer: () => {
    const { View } = require('react-native');
    return <View testID="onboarding-slide-viewer" />;
  },
}));

describe('OnboardingPage', () => {
  it('OnboardingSlideViewer를 렌더링한다', () => {
    const { getByTestId } = render(<OnboardingPage />);

    expect(getByTestId('onboarding-slide-viewer')).toBeTruthy();
  });

  it('AuthButtonContainer를 렌더링한다', () => {
    const { getByTestId } = render(<OnboardingPage />);

    expect(getByTestId('auth-button-container')).toBeTruthy();
  });
});
