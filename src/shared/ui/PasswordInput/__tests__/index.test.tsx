import React from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../index';

describe('PasswordInput', () => {
  it('label을 렌더링한다', () => {
    const { getByText } = render(<PasswordInput label="비밀번호" />);
    expect(getByText('비밀번호')).toBeTruthy();
  });

  it('기본적으로 secureTextEntry가 true이다', () => {
    const { UNSAFE_getByType } = render(<PasswordInput label="비밀번호" />);
    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(true);
  });

  it('토글 버튼 클릭 시 secureTextEntry가 false로 바뀐다', () => {
    const { UNSAFE_getByType } = render(<PasswordInput label="비밀번호" />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(false);
  });

  it('토글 버튼을 두 번 클릭하면 다시 secureTextEntry가 true로 바뀐다', () => {
    const { UNSAFE_getByType } = render(<PasswordInput label="비밀번호" />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(true);
  });

  it('onChangeText 콜백을 호출한다', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = render(
      <PasswordInput label="비밀번호" onChangeText={onChangeText} />
    );
    fireEvent.changeText(UNSAFE_getByType(TextInput), '1234');
    expect(onChangeText).toHaveBeenCalledWith('1234');
  });

  it('스냅샷 - 기본 (숨김 상태)', () => {
    const { toJSON } = render(<PasswordInput label="비밀번호" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 토글 후 (보임 상태)', () => {
    const { UNSAFE_getByType, toJSON } = render(<PasswordInput label="비밀번호" />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(toJSON()).toMatchSnapshot();
  });
});
