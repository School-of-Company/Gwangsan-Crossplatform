import { fireEvent, render } from '@testing-library/react-native';
import { Dimensions, ScrollView, Text } from 'react-native';
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

describe('TabPager 스크롤 동작', () => {
  const getPager = (utils: ReturnType<typeof render>) =>
    utils.UNSAFE_getAllByType(ScrollView).find((sv) => sv.props.horizontal)!;

  it('탭을 누르면 해당 위치로 scrollTo 한다', () => {
    const utils = render(
      <TabPager tabs={TABS} value="a" onChange={jest.fn()} testIDPrefix="t">
        {() => <Text>panel</Text>}
      </TabPager>
    );
    const scrollTo = jest.spyOn(getPager(utils).instance, 'scrollTo');
    const { width } = Dimensions.get('window');

    fireEvent.press(utils.getByTestId('t-b'));

    expect(scrollTo).toHaveBeenCalledWith({ x: width, animated: true });
  });

  it('스와이프가 끝나면 해당 탭으로 onChange 하고, 같은 탭이면 호출하지 않는다', () => {
    const onChange = jest.fn();
    const utils = render(
      <TabPager tabs={TABS} value="a" onChange={onChange} testIDPrefix="t">
        {() => <Text>panel</Text>}
      </TabPager>
    );
    const { width } = Dimensions.get('window');

    fireEvent(getPager(utils), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 0 } },
    });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent(getPager(utils), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: width } },
    });
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('contentOffset은 처음 마운트할 때만 잡고 탭이 바뀌어도 다시 넣지 않는다', () => {
    const utils = render(
      <TabPager tabs={TABS} value="a" onChange={jest.fn()} testIDPrefix="t">
        {() => <Text>panel</Text>}
      </TabPager>
    );
    expect(getPager(utils).props.contentOffset).toEqual({ x: 0, y: 0 });

    utils.rerender(
      <TabPager tabs={TABS} value="b" onChange={jest.fn()} testIDPrefix="t">
        {() => <Text>panel</Text>}
      </TabPager>
    );
    expect(getPager(utils).props.contentOffset).toEqual({ x: 0, y: 0 });
  });
});
