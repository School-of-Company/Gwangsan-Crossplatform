import { fireEvent, render } from '@testing-library/react-native';
import type { ToastConfigParams } from 'react-native-toast-message';
import { toastConfig } from '../index';

const buildParams = (
  overrides: Partial<ToastConfigParams<unknown>>
): ToastConfigParams<unknown> => ({
  position: 'top',
  type: 'success',
  isVisible: true,
  show: jest.fn(),
  hide: jest.fn(),
  onPress: jest.fn(),
  props: undefined,
  ...overrides,
});

describe('toastConfig', () => {
  it.each(['success', 'error', 'info'] as const)(
    '%s 타입은 text1과 text2를 모두 렌더링한다',
    (type) => {
      const params = buildParams({ type, text1: '제목', text2: '상세 설명' });

      const { getByText } = render(<>{toastConfig[type](params)}</>);

      expect(getByText('제목')).toBeTruthy();
      expect(getByText('상세 설명')).toBeTruthy();
    }
  );

  it('text2가 없으면 text1만 렌더링한다', () => {
    const params = buildParams({ type: 'error', text1: '실패했습니다' });

    const { getByText, queryByText } = render(<>{toastConfig.error(params)}</>);

    expect(getByText('실패했습니다')).toBeTruthy();
    expect(queryByText('undefined')).toBeNull();
  });

  it('눌렀을 때 onPress를 호출한다', () => {
    const onPress = jest.fn();
    const params = buildParams({ type: 'info', text1: '알림', onPress });

    const { getByTestId } = render(<>{toastConfig.info(params)}</>);
    fireEvent.press(getByTestId('gwangsan-toast'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
