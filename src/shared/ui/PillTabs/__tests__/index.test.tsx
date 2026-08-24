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
});
