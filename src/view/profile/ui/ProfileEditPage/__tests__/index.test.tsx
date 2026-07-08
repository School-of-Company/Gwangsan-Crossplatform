import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import ProfileEditPageView from '../index';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useUpdateProfile } from '~/view/profile/model/useUpdateProfile';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/view/profile/model/useGetMyProfile', () => ({ useGetMyProfile: jest.fn() }));
jest.mock('~/view/profile/model/useUpdateProfile', () => ({ useUpdateProfile: jest.fn() }));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header">{headerTitle}</Text>;
  },
  Input: ({ label, value, onChangeText, placeholder }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        testID={`input-${label}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    );
  },
  Button: ({ children, onPress, disabled }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="submit-button" disabled={disabled} onPress={disabled ? undefined : onPress}>
        <Text>{children}</Text>
      </View>
    );
  },
}));

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ label, value, onChangeText, placeholder }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        testID={`textfield-${label}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    );
  },
}));

jest.mock('~/entity/auth/ui/SpecialtiesDropdown', () => ({
  __esModule: true,
  default: ({ selectedItems, onSelect }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="specialties-dropdown" onPress={() => onSelect(['요리'])}>
        <Text>{selectedItems?.join(',')}</Text>
      </TouchableOpacity>
    );
  },
}));

const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseUpdateProfile = useUpdateProfile as jest.Mock;

const mockMutate = jest.fn();

const defaultProfileData = {
  memberId: 1,
  nickname: '기존닉네임',
  specialties: ['빨래하기'],
  description: '기존 소개',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseGetMyProfile.mockReturnValue({ data: defaultProfileData, isLoading: false });
  mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: false });
});

describe('ProfileEditPageView', () => {
  it('로딩 중이면 ActivityIndicator를 표시한다', () => {
    mockUseGetMyProfile.mockReturnValue({ data: undefined, isLoading: true });

    const { UNSAFE_getByType, queryByTestId } = render(<ProfileEditPageView />);

    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByTestId('submit-button')).toBeNull();
  });

  it('프로필 데이터를 입력 필드 초기값으로 채운다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('input-별칭').props.value).toBe('기존닉네임');
    expect(getByTestId('textfield-자기소개').props.value).toBe('기존 소개');
  });

  it('헤더에 "내 정보 수정" 타이틀을 표시한다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('header').props.children).toBe('내 정보 수정');
  });

  it('필수 항목이 모두 채워지면 제출 버튼이 활성화된다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('submit-button').props.disabled).toBe(false);
  });

  it('닉네임이 비어있으면 제출 버튼이 비활성화된다', () => {
    mockUseGetMyProfile.mockReturnValue({
      data: { ...defaultProfileData, nickname: '' },
      isLoading: false,
    });

    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('submit-button').props.disabled).toBe(true);
  });

  it('특기가 없으면 제출 버튼이 비활성화된다', () => {
    mockUseGetMyProfile.mockReturnValue({
      data: { ...defaultProfileData, specialties: [] },
      isLoading: false,
    });

    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('submit-button').props.disabled).toBe(true);
  });

  it('자기소개가 비어있으면 제출 버튼이 비활성화된다', () => {
    mockUseGetMyProfile.mockReturnValue({
      data: { ...defaultProfileData, description: '' },
      isLoading: false,
    });

    const { getByTestId } = render(<ProfileEditPageView />);

    expect(getByTestId('submit-button').props.disabled).toBe(true);
  });

  it('제출 진행 중이면 버튼 텍스트가 "수정 중..."으로 바뀌고 비활성화된다', () => {
    mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: true });

    const { getByText, getByTestId } = render(<ProfileEditPageView />);

    expect(getByText('수정 중...')).toBeTruthy();
    expect(getByTestId('submit-button').props.disabled).toBe(true);
  });

  it('제출 버튼 클릭 시 유효한 데이터로 updateProfile mutation을 호출한다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.press(getByTestId('submit-button'));

    expect(mockMutate).toHaveBeenCalledWith({
      nickname: '기존닉네임',
      specialties: ['빨래하기'],
      description: '기존 소개',
    });
  });

  it('닉네임을 변경하면 변경된 값으로 mutation을 호출한다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.changeText(getByTestId('input-별칭'), '새로운닉네임');
    fireEvent.press(getByTestId('submit-button'));

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ nickname: '새로운닉네임' }));
  });

  it('닉네임이 유효성 검사 정규식을 통과하지 못하면 에러 Toast를 표시하고 mutation을 호출하지 않는다', () => {
    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.changeText(getByTestId('input-별칭'), '!!!invalid###');
    fireEvent.press(getByTestId('submit-button'));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '입력 오류' })
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('특기 선택 시 SpecialtiesDropdown의 onSelect가 상태를 갱신한다', () => {
    mockUseGetMyProfile.mockReturnValue({
      data: { ...defaultProfileData, specialties: [] },
      isLoading: false,
    });

    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.press(getByTestId('specialties-dropdown'));
    fireEvent.press(getByTestId('submit-button'));

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ specialties: ['요리'] }));
  });
});
