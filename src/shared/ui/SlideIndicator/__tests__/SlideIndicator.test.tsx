import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { SlideIndicator } from '../index';

describe('SlideIndicator', () => {
  it('total 수만큼 점을 렌더링한다', () => {
    const { toJSON } = render(<SlideIndicator total={4} current={0} />);
    expect(toJSON()!.children).toHaveLength(4);
  });

  it('onPress가 없으면 터치 가능한 요소를 렌더링하지 않는다', () => {
    const { UNSAFE_queryAllByType } = render(<SlideIndicator total={3} current={0} />);
    expect(UNSAFE_queryAllByType(TouchableOpacity)).toHaveLength(0);
  });

  it('onPress가 있으면 각 점을 TouchableOpacity로 렌더링한다', () => {
    const onPress = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <SlideIndicator total={3} current={0} onPress={onPress} />
    );
    expect(UNSAFE_getAllByType(TouchableOpacity)).toHaveLength(3);
  });

  it('점 클릭 시 해당 인덱스로 onPress를 호출한다', () => {
    const onPress = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <SlideIndicator total={3} current={0} onPress={onPress} />
    );
    fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[2]);
    expect(onPress).toHaveBeenCalledWith(2);
  });

  it('스냅샷 - onPress 없음', () => {
    const { toJSON } = render(<SlideIndicator total={3} current={1} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - onPress 있음', () => {
    const { toJSON } = render(<SlideIndicator total={3} current={1} onPress={jest.fn()} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
