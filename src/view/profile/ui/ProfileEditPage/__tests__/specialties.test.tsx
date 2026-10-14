import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileEditPageView from '../index';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useUpdateProfile } from '~/view/profile/model/useUpdateProfile';
import { useUpdateBranch } from '~/view/profile/model/useUpdateBranch';
import { useBottomSheetPortalStore } from '~/shared/store/useBottomSheetPortalStore';

// index.test.tsx와 달리 SpecialtiesDropdown을 mock하지 않고 실제 컴포넌트로 렌더링해,
// 프로필을 불러온 뒤 칩의 선택 상태가 기존 특기와 맞는지 확인한다.

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  return { __esModule: true, default: () => React.createElement('View', null) };
});

jest.mock('~/view/profile/model/useGetMyProfile', () => ({ useGetMyProfile: jest.fn() }));
jest.mock('~/view/profile/model/useUpdateProfile', () => ({ useUpdateProfile: jest.fn() }));
jest.mock('~/view/profile/model/useUpdateBranch', () => ({ useUpdateBranch: jest.fn() }));

jest.mock('~/shared/ui', () => {
  const React = require('react');
  const { Text, TextInput, TouchableOpacity } = require('react-native');
  return {
    Header: ({ headerTitle }: any) => React.createElement(Text, null, headerTitle),
    Input: React.forwardRef(({ label, ...props }: any, ref: any) =>
      React.createElement(TextInput, { ref, testID: `input-${label}`, ...props })
    ),
    Button: ({ children, onPress, disabled }: any) =>
      React.createElement(
        TouchableOpacity,
        { testID: 'submit-button', onPress, disabled },
        React.createElement(Text, null, children)
      ),
  };
});

jest.mock('~/shared/ui/TextField', () => ({
  TextField: ({ label, value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput testID={`textfield-${label}`} value={value} onChangeText={onChangeText} />;
  },
}));

const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseUpdateProfile = useUpdateProfile as jest.Mock;
const mockUseUpdateBranch = useUpdateBranch as jest.Mock;
const mockMutate = jest.fn();

const profileData = {
  memberId: 1,
  nickname: '기존닉네임',
  // '목공'은 기본 목록(SPECIALTIES)에 없는, 직접 입력으로 추가한 특기다
  specialties: ['빨래하기', '목공'],
  description: '기존 소개',
};

const isChipSelected = (getByTestId: (id: string) => any, item: string) =>
  getByTestId(`specialty-chip-${item}`).props.accessibilityState?.selected;

beforeEach(() => {
  jest.clearAllMocks();
  useBottomSheetPortalStore.getState().reset();
  mockUseUpdateProfile.mockReturnValue({ mutate: mockMutate, isPending: false });
  mockUseUpdateBranch.mockReturnValue({ mutate: jest.fn(), isPending: false });
});

describe('ProfileEditPageView 특기 선택 상태', () => {
  it('캐시에 프로필이 있으면 기존 특기(직접 입력 포함)가 선택된 상태로 보인다', () => {
    mockUseGetMyProfile.mockReturnValue({ data: profileData, isLoading: false });

    const { getByTestId } = render(<ProfileEditPageView />);

    expect(isChipSelected(getByTestId, '빨래하기')).toBe(true);
    expect(isChipSelected(getByTestId, '목공')).toBe(true);
    expect(isChipSelected(getByTestId, '벌레잡기')).toBe(false);
  });

  it('로딩이 끝난 뒤 프로필이 들어와도 기존 특기가 선택된 상태로 보인다', () => {
    mockUseGetMyProfile.mockReturnValue({ data: undefined, isLoading: true });
    const { getByTestId, rerender } = render(<ProfileEditPageView />);

    mockUseGetMyProfile.mockReturnValue({ data: profileData, isLoading: false });
    rerender(<ProfileEditPageView />);

    expect(isChipSelected(getByTestId, '빨래하기')).toBe(true);
    expect(isChipSelected(getByTestId, '목공')).toBe(true);
  });

  it('칩을 추가로 선택하면 기존 특기를 유지한 채로 저장한다', () => {
    mockUseGetMyProfile.mockReturnValue({ data: profileData, isLoading: false });
    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.press(getByTestId('specialty-chip-벌레잡기'));
    fireEvent.press(getByTestId('submit-button'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ specialties: ['빨래하기', '목공', '벌레잡기'] })
    );
  });

  it('기존 특기를 해제하면 화면에 보이는 선택 상태 그대로 저장한다', () => {
    mockUseGetMyProfile.mockReturnValue({ data: profileData, isLoading: false });
    const { getByTestId } = render(<ProfileEditPageView />);

    fireEvent.press(getByTestId('specialty-chip-빨래하기'));

    expect(isChipSelected(getByTestId, '빨래하기')).toBe(false);
    // 해제한 직접 입력 항목도 칩으로 남아 있어 다시 고를 수 있다
    expect(isChipSelected(getByTestId, '목공')).toBe(true);

    fireEvent.press(getByTestId('submit-button'));

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ specialties: ['목공'] }));
  });
});
