import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ProgressBar from '../index';

describe('ProgressBar', () => {
  it('"밝기" 라벨을 렌더링한다', () => {
    const { getByText } = render(<ProgressBar value={50} onChange={jest.fn()} />);
    expect(getByText('밝기')).toBeTruthy();
  });

  it('value prop이 바뀌어도 에러 없이 다시 렌더링된다', () => {
    const { rerender, getByText } = render(<ProgressBar value={20} onChange={jest.fn()} />);
    expect(() => rerender(<ProgressBar value={80} onChange={jest.fn()} />)).not.toThrow();
    expect(getByText('밝기')).toBeTruthy();
  });

  it('레이아웃 측정 후에도 에러 없이 렌더링된다', () => {
    const { UNSAFE_getAllByType } = render(<ProgressBar value={50} onChange={jest.fn()} />);
    const root = UNSAFE_getAllByType(View)[0];
    expect(() =>
      fireEvent(root, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 48 } },
      })
    ).not.toThrow();
  });

  it('스냅샷 - 기본값', () => {
    const { toJSON } = render(<ProgressBar value={0} onChange={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 커스텀 min/max/value', () => {
    const { toJSON } = render(
      <ProgressBar value={5} min={0} max={10} step={1} onChange={jest.fn()} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
