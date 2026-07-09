import React, { createRef } from 'react';
import { Text, TextInput } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../index';

describe('Input', () => {
  it('label을 렌더링한다', () => {
    const { getByText } = render(<Input label="이메일" />);
    expect(getByText('이메일')).toBeTruthy();
  });

  it('placeholder를 렌더링한다', () => {
    const { getByPlaceholderText } = render(<Input label="이메일" placeholder="you@example.com" />);
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  it('value를 렌더링한다', () => {
    const { getByDisplayValue } = render(
      <Input label="이메일" value="test@test.com" onChangeText={jest.fn()} />
    );
    expect(getByDisplayValue('test@test.com')).toBeTruthy();
  });

  it('onChangeText 콜백을 호출한다', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input label="이메일" placeholder="입력" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('입력'), '새 값');
    expect(onChangeText).toHaveBeenCalledWith('새 값');
  });

  it('icon prop을 렌더링한다', () => {
    const { getByText } = render(<Input label="이메일" icon={<Text>아이콘</Text>} />);
    expect(getByText('아이콘')).toBeTruthy();
  });

  it('icon이 없으면 렌더링하지 않는다', () => {
    const { queryByText } = render(<Input label="이메일" />);
    expect(queryByText('아이콘')).toBeNull();
  });

  it('ref를 TextInput으로 전달한다', () => {
    const ref = createRef<TextInput>();
    render(<Input label="이메일" ref={ref} />);
    expect(ref.current).toBeTruthy();
  });

  it('스냅샷 - 기본', () => {
    const { toJSON } = render(<Input label="이메일" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - icon 있음', () => {
    const { toJSON } = render(<Input label="이메일" icon={<Text>아이콘</Text>} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
