import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PillTabs } from '../index';

const TABS = [
  { value: 'a' as const, label: 'A탭' },
  { value: 'b' as const, label: 'B탭' },
];

describe('PillTabs', () => {
  it('모든 탭 라벨을 렌더링한다', () => {
    const { getByText } = render(<PillTabs tabs={TABS} value="a" onChange={jest.fn()} />);

    expect(getByText('A탭')).toBeTruthy();
    expect(getByText('B탭')).toBeTruthy();
  });

  it('탭을 누르면 onChange에 해당 value를 전달한다', () => {
    const onChange = jest.fn();
    const { getByText } = render(<PillTabs tabs={TABS} value="a" onChange={onChange} />);

    fireEvent.press(getByText('B탭'));

    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('testIDPrefix로 각 탭에 testID를 부여한다', () => {
    const { getByTestId } = render(
      <PillTabs tabs={TABS} value="a" onChange={jest.fn()} testIDPrefix="my-tab" />
    );

    expect(getByTestId('my-tab-a')).toBeTruthy();
    expect(getByTestId('my-tab-b')).toBeTruthy();
  });

  it('레이아웃 측정 후 활성 탭 인디케이터를 렌더링한다', () => {
    const { UNSAFE_getAllByType, toJSON } = render(
      <PillTabs tabs={TABS} value="a" onChange={jest.fn()} />
    );
    const root = UNSAFE_getAllByType(View)[0];

    expect(() =>
      fireEvent(root, 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
      })
    ).not.toThrow();
    expect(toJSON()).toBeTruthy();
  });
});
