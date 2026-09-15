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

  it('포커스되어도 기존 값이 사라지지 않는다(#642)', () => {
    const { getByDisplayValue, UNSAFE_getByType } = render(
      <TextField label="내용" value="기존에 써둔 글" onChangeText={jest.fn()} />
    );

    fireEvent(UNSAFE_getByType(TextInput), 'focus');

    expect(getByDisplayValue('기존에 써둔 글')).toBeTruthy();
  });

  it('비동기로 나중에 도착한 값(예: 상세 조회 응답)으로 정상적으로 갱신된다', () => {
    const { getByDisplayValue, rerender } = render(
      <TextField label="내용" value="" onChangeText={jest.fn()} />
    );

    rerender(<TextField label="내용" value="서버에서 불러온 기존 글" onChangeText={jest.fn()} />);

    expect(getByDisplayValue('서버에서 불러온 기존 글')).toBeTruthy();
  });

  it('폼 리셋처럼 외부에서 값을 비우면 입력값도 비워진다', () => {
    const { getByDisplayValue, queryByDisplayValue, rerender } = render(
      <TextField label="사유" value="작성 중이던 사유" onChangeText={jest.fn()} />
    );
    expect(getByDisplayValue('작성 중이던 사유')).toBeTruthy();

    rerender(<TextField label="사유" value="" onChangeText={jest.fn()} />);

    expect(queryByDisplayValue('작성 중이던 사유')).toBeNull();
  });

  it('직접 타이핑해서 반영된 값이 그대로 부모의 value로 되돌아와도(echo) 값이 유지된다', () => {
    const Wrapper = () => {
      const [text, setText] = React.useState('안녕');
      return <TextField label="내용" value={text} onChangeText={setText} />;
    };

    const { getByDisplayValue, UNSAFE_getByType } = render(<Wrapper />);

    fireEvent.changeText(UNSAFE_getByType(TextInput), '안녕하세요');

    expect(getByDisplayValue('안녕하세요')).toBeTruthy();
  });

  it('스냅샷', () => {
    const { toJSON } = render(<TextField label="상세 설명" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
