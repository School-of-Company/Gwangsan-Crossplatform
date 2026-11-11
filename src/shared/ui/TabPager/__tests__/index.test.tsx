import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TabPager } from '../index';

const TABS = [
  { value: 'a' as const, label: '첫째' },
  { value: 'b' as const, label: '둘째' },
];

describe('TabPager', () => {
  it('탭을 누르면 onChange를 호출하고 패널을 width와 함께 그린다', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <TabPager tabs={TABS} value="a" onChange={onChange} testIDPrefix="t">
        {(width) => <Text>{`panel-${width > 0}`}</Text>}
      </TabPager>
    );

    expect(getByText('panel-true')).toBeTruthy();
    fireEvent.press(getByTestId('t-b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('fallback이 있으면 탭은 두고 패널 대신 fallback을 그린다', () => {
    const { getByText, queryByText, getByTestId } = render(
      <TabPager
        tabs={TABS}
        value="a"
        onChange={jest.fn()}
        testIDPrefix="t"
        fallback={<Text>로딩</Text>}>
        {() => <Text>panel</Text>}
      </TabPager>
    );

    expect(getByText('로딩')).toBeTruthy();
    expect(queryByText('panel')).toBeNull();
    expect(getByTestId('t-a')).toBeTruthy();
  });
});
