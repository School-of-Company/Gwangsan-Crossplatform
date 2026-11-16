import { renderHook } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { useErrorToastOnTransition } from '../useErrorToastOnTransition';

jest.mock('react-native-toast-message', () => ({ __esModule: true, default: { show: jest.fn() } }));

describe('useErrorToastOnTransition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('실패로 바뀌는 순간에만 토스트를 띄우고, 같은 실패가 이어지면 다시 띄우지 않는다', () => {
    const { rerender } = renderHook(
      ({ isError, text2 }: { isError: boolean; text2?: string }) =>
        useErrorToastOnTransition(isError, '실패', text2),
      { initialProps: { isError: false } as { isError: boolean; text2?: string } }
    );
    expect(Toast.show).not.toHaveBeenCalled();

    rerender({ isError: true, text2: 'a' });
    rerender({ isError: true, text2: 'b' });
    expect(Toast.show).toHaveBeenCalledTimes(1);
    expect(Toast.show).toHaveBeenCalledWith({ type: 'error', text1: '실패', text2: 'a' });
  });

  it('text2가 없거나 비어 있으면 기본 문구를 쓴다', () => {
    renderHook(() => useErrorToastOnTransition(true, '실패', ''));
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ text2: '잠시 후 다시 시도해주세요.' })
    );
  });

  it('canShow가 false면 실패로 바뀌어도 띄우지 않는다', () => {
    renderHook(() => useErrorToastOnTransition(true, '실패', undefined, false));
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
