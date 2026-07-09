import React from 'react';
import { render } from '@testing-library/react-native';
import { useSignupCurrentStep } from '~/entity/auth/model/useAuthSelectors';
import SignupPage from '../index';

jest.mock('~/entity/auth/model/useAuthSelectors', () => ({
  useSignupCurrentStep: jest.fn(),
}));

jest.mock('@/widget/signup', () => {
  const { Text } = require('react-native');
  const makeStep = (testID: string, label: string) => () => <Text testID={testID}>{label}</Text>;
  return {
    TermsStep: makeStep('terms-step', 'terms'),
    NameStep: makeStep('name-step', 'name'),
    NicknameStep: makeStep('nickname-step', 'nickname'),
    PasswordStep: makeStep('password-step', 'password'),
    PhoneStep: makeStep('phone-step', 'phone'),
    DongStep: makeStep('dong-step', 'dong'),
    PlaceStep: makeStep('place-step', 'place'),
    SpecialtiesStep: makeStep('specialties-step', 'specialties'),
    DescriptionStep: makeStep('description-step', 'description'),
    RecommenderStep: makeStep('recommender-step', 'recommender'),
    Complete: makeStep('complete-step', 'complete'),
  };
});

const mockUseSignupCurrentStep = useSignupCurrentStep as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('SignupPage', () => {
  it.each([
    ['terms', 'terms-step'],
    ['name', 'name-step'],
    ['nickname', 'nickname-step'],
    ['password', 'password-step'],
    ['phoneNumber', 'phone-step'],
    ['dongName', 'dong-step'],
    ['placeName', 'place-step'],
    ['specialties', 'specialties-step'],
    ['description', 'description-step'],
    ['recommender', 'recommender-step'],
    ['complete', 'complete-step'],
  ])('currentStep이 %s이면 %s를 렌더링한다', (step, testID) => {
    mockUseSignupCurrentStep.mockReturnValue(step);

    const { getByTestId } = render(<SignupPage />);

    expect(getByTestId(testID)).toBeTruthy();
  });
});
