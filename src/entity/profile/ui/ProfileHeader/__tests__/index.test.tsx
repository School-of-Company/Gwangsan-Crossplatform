import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileHeader from '../index';

const baseProps = {
  name: '홍길동',
  isMenuDisabled: false,
  onEditProfile: jest.fn(),
  onMenuPress: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ProfileHeader', () => {
  it('내 프로필이면 프로필 사진 대체 텍스트와 편집 버튼(testID 유지)을 렌더링한다', () => {
    const onEditProfile = jest.fn();
    const { getByLabelText, getByTestId } = render(
      <ProfileHeader {...baseProps} isMe onEditProfile={onEditProfile} />
    );

    expect(getByLabelText('내 프로필 사진')).toBeTruthy();
    fireEvent.press(getByTestId('Information-edit-button'));
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });

  it('다른 사람 프로필이면 닉네임이 담긴 사진 대체 텍스트와 메뉴 버튼 라벨을 지정한다', () => {
    const onMenuPress = jest.fn();
    const { getByLabelText, getByRole } = render(
      <ProfileHeader {...baseProps} isMe={false} onMenuPress={onMenuPress} />
    );

    expect(getByLabelText('홍길동 프로필 사진')).toBeTruthy();
    fireEvent.press(getByRole('button', { name: '사용자 메뉴 더보기' }));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
  });

  it('메뉴를 쓸 수 없으면 비활성 상태를 스크린리더에 알린다', () => {
    const { getByRole } = render(<ProfileHeader {...baseProps} isMe={false} isMenuDisabled />);

    expect(getByRole('button', { name: '사용자 메뉴 더보기' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
  });
});
