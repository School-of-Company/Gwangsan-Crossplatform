import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { Button } from '../index';

describe('Button', () => {
  it('children 텍스트를 렌더링한다', () => {
    const { getByText } = render(<Button>확인</Button>);
    expect(getByText('확인')).toBeTruthy();
  });

  it('onPress 콜백을 호출한다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button onPress={onPress}>확인</Button>);
    fireEvent.press(getByText('확인'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled 상태에서 버튼이 비활성화된다', () => {
    const { UNSAFE_getByType } = render(<Button disabled>확인</Button>);
    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });

  it('스냅샷 - primary variant (기본값)', () => {
    const { toJSON } = render(<Button>확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - secondary variant', () => {
    const { toJSON } = render(<Button variant="secondary">확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - error variant', () => {
    const { toJSON } = render(<Button variant="error">확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - disabled 상태', () => {
    const { toJSON } = render(<Button disabled>확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });
});
