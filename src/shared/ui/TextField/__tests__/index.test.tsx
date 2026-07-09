import React from 'react';
import { TextInput } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { TextField } from '../index';

describe('TextField', () => {
  it('label을 렌더링한다', () => {
    const { getByText } = render(<TextField label="상세 설명" />);
    expect(getByText('상세 설명')).toBeTruthy();
  });

  it('placeholder를 렌더링한다', () => {
    const { getByPlaceholderText } = render(
      <TextField label="상세 설명" placeholder="내용을 입력하세요" />
    );
    expect(getByPlaceholderText('내용을 입력하세요')).toBeTruthy();
  });

  it('value를 렌더링한다', () => {
    const { getByDisplayValue } = render(
      <TextField label="상세 설명" value="안녕하세요" onChangeText={jest.fn()} />
    );
    expect(getByDisplayValue('안녕하세요')).toBeTruthy();
  });

  it('onChangeText 콜백을 호출한다', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = render(
      <TextField label="상세 설명" onChangeText={onChangeText} />
    );
    fireEvent.changeText(UNSAFE_getByType(TextInput), '새 내용');
    expect(onChangeText).toHaveBeenCalledWith('새 내용');
  });

  it('multiline이 기본으로 true이다', () => {
    const { UNSAFE_getByType } = render(<TextField label="상세 설명" />);
    expect(UNSAFE_getByType(TextInput).props.multiline).toBe(true);
  });

  it('스냅샷', () => {
    const { toJSON } = render(<TextField label="상세 설명" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
