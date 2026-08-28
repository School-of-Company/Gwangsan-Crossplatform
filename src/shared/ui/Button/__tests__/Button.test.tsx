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

  it('press in/out 시 전달된 onPressIn/onPressOut 콜백을 호출한다', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByText } = render(
      <Button onPressIn={onPressIn} onPressOut={onPressOut}>
        확인
      </Button>
    );

    fireEvent(getByText('확인'), 'pressIn');
    fireEvent(getByText('확인'), 'pressOut');

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('onPressIn/onPressOut이 전달되지 않아도 에러 없이 press in/out을 처리한다', () => {
    const { getByText } = render(<Button>확인</Button>);

    expect(() => {
      fireEvent(getByText('확인'), 'pressIn');
      fireEvent(getByText('확인'), 'pressOut');
    }).not.toThrow();
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

  it('스냅샷 - neutral variant', () => {
    const { toJSON } = render(<Button variant="neutral">확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - disabled 상태', () => {
    const { toJSON } = render(<Button disabled>확인</Button>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - disabled + secondary variant', () => {
    const { toJSON } = render(
      <Button disabled variant="secondary">
        확인
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - disabled + neutral variant', () => {
    const { toJSON } = render(
      <Button disabled variant="neutral">
        확인
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - disabled + error variant', () => {
    const { toJSON } = render(
      <Button disabled variant="error">
        확인
      </Button>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
