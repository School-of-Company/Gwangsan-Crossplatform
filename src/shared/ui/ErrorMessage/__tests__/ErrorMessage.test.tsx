import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorMessage } from '../index';

describe('ErrorMessage', () => {
  it('error 문자열이 있으면 텍스트를 렌더링한다', () => {
    const { getByText } = render(<ErrorMessage error="이메일 형식이 올바르지 않습니다" />);
    expect(getByText('이메일 형식이 올바르지 않습니다')).toBeTruthy();
  });

  it('error가 null이면 텍스트를 렌더링하지 않는다', () => {
    const { queryByText } = render(<ErrorMessage error={null} />);
    expect(queryByText(/.+/)).toBeNull();
  });

  it('error가 undefined이면 텍스트를 렌더링하지 않는다', () => {
    const { queryByText } = render(<ErrorMessage />);
    expect(queryByText(/.+/)).toBeNull();
  });

  it('스냅샷 - 에러 있음', () => {
    const { toJSON } = render(<ErrorMessage error="필수 항목입니다" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 에러 없음', () => {
    const { toJSON } = render(<ErrorMessage />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - custom className', () => {
    const { toJSON } = render(<ErrorMessage error="오류" className="h-8" />);
    expect(toJSON()).toMatchSnapshot();
  });
});
