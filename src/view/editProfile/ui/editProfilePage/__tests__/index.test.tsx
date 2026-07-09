import React from 'react';
import { render } from '@testing-library/react-native';
import EditProfilePageView from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('~/entity/auth', () => ({
  SpecialtiesDropdown: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text testID="specialties-dropdown">{label}</Text>;
  },
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: { headerTitle: string }) => {
    const { Text } = require('react-native');
    return <Text testID="header">{headerTitle}</Text>;
  },
  Input: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text testID="input">{label}</Text>;
  },
  Button: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text testID="submit-button">{children}</Text>;
  },
}));

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text testID="text-field">{label}</Text>;
  },
}));

describe('EditProfilePage', () => {
  it('헤더에 "프로필 수정" 타이틀을 표시한다', () => {
    const { getByTestId } = render(<EditProfilePageView />);

    expect(getByTestId('header').props.children).toBe('프로필 수정');
  });

  it('별칭 Input을 렌더링한다', () => {
    const { getByTestId } = render(<EditProfilePageView />);

    expect(getByTestId('input').props.children).toBe('별칭');
  });

  it('특기 SpecialtiesDropdown을 렌더링한다', () => {
    const { getByTestId } = render(<EditProfilePageView />);

    expect(getByTestId('specialties-dropdown').props.children).toBe('특기');
  });

  it('자기소개 TextField를 렌더링한다', () => {
    const { getByTestId } = render(<EditProfilePageView />);

    expect(getByTestId('text-field').props.children).toBe('자기소개');
  });

  it('수정 버튼을 렌더링한다', () => {
    const { getByTestId } = render(<EditProfilePageView />);

    expect(getByTestId('submit-button').props.children).toBe('수정');
  });
});
