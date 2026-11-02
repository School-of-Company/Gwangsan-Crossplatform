import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorFallback } from '../index';

describe('ErrorFallback', () => {
  it('"오류가 발생했습니다" 텍스트를 렌더링한다', () => {
    const { getByText } = render(<ErrorFallback />);
    expect(getByText('오류가 발생했습니다')).toBeTruthy();
  });

  it('"잠시 후 다시 시도해 주세요." 텍스트를 렌더링한다', () => {
    const { getByText } = render(<ErrorFallback />);
    expect(getByText('잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });

  it('"다시 시도" 버튼 클릭 시 onRetry를 호출한다', () => {
    const onRetry = jest.fn();
    const { getByText } = render(<ErrorFallback onRetry={onRetry} />);
    fireEvent.press(getByText('다시 시도'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetry가 없어도 에러 없이 렌더링되고 클릭해도 문제없다', () => {
    const { getByText } = render(<ErrorFallback />);
    expect(() => fireEvent.press(getByText('다시 시도'))).not.toThrow();
  });

  it('title과 message를 넘기면 기본 문구 대신 보여준다', () => {
    const { getByText, queryByText } = render(
      <ErrorFallback
        title="게시글을 불러오는데 실패했습니다."
        message="네트워크를 확인해 주세요."
      />
    );
    expect(getByText('게시글을 불러오는데 실패했습니다.')).toBeTruthy();
    expect(getByText('네트워크를 확인해 주세요.')).toBeTruthy();
    expect(queryByText('오류가 발생했습니다')).toBeNull();
  });

  it('스냅샷', () => {
    const { toJSON } = render(<ErrorFallback onRetry={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
