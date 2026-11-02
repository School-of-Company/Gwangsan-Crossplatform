import { act, renderHook } from '@testing-library/react-native';
import { useNavigation } from 'expo-router';
import { useLeaveConfirm } from '../useLeaveConfirm';

jest.mock('expo-router', () => ({
  useNavigation: jest.fn(),
}));

type BeforeRemoveListener = (event: {
  preventDefault: () => void;
  data: { action: { type: string } };
}) => void;

const mockUseNavigation = useNavigation as jest.Mock;

const setupNavigation = () => {
  let listener: BeforeRemoveListener | null = null;
  const navigation = {
    setOptions: jest.fn(),
    dispatch: jest.fn(),
    addListener: jest.fn((_: string, cb: BeforeRemoveListener) => {
      listener = cb;
      return jest.fn();
    }),
  };
  mockUseNavigation.mockReturnValue(navigation);
  const fireBeforeRemove = () => {
    const event = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
    act(() => listener?.(event));
    return event;
  };
  return { navigation, fireBeforeRemove };
};

describe('useLeaveConfirm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('확인이 필요 없으면 화면을 떠나는 것을 막지 않고 스와이프 제스처를 켜 둔다', () => {
    const { navigation, fireBeforeRemove } = setupNavigation();
    const { result } = renderHook(() => useLeaveConfirm(false));

    const event = fireBeforeRemove();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isConfirmVisible).toBe(false);
    expect(navigation.setOptions).toHaveBeenCalledWith({ gestureEnabled: true });
  });

  it('작성 중이면 떠나는 것을 막고 확인 모달을 띄우며 스와이프 제스처를 끈다', () => {
    const { navigation, fireBeforeRemove } = setupNavigation();
    const { result } = renderHook(() => useLeaveConfirm(true));

    const event = fireBeforeRemove();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isConfirmVisible).toBe(true);
    expect(navigation.setOptions).toHaveBeenCalledWith({ gestureEnabled: false });
  });

  it('나가기를 확인하면 막아둔 이동을 그대로 실행한다', () => {
    const { navigation, fireBeforeRemove } = setupNavigation();
    const { result } = renderHook(() => useLeaveConfirm(true));

    fireBeforeRemove();
    act(() => result.current.confirmLeave());

    expect(result.current.isConfirmVisible).toBe(false);
    expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('취소하면 모달만 닫고 이동하지 않는다', () => {
    const { navigation, fireBeforeRemove } = setupNavigation();
    const { result } = renderHook(() => useLeaveConfirm(true));

    fireBeforeRemove();
    act(() => result.current.cancelLeave());

    expect(result.current.isConfirmVisible).toBe(false);
    expect(navigation.dispatch).not.toHaveBeenCalled();
  });

  it('allowLeave 이후에는 작성 중이어도 확인 없이 떠난다', () => {
    const { fireBeforeRemove } = setupNavigation();
    const { result } = renderHook(() => useLeaveConfirm(true));

    act(() => result.current.allowLeave());
    const event = fireBeforeRemove();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.isConfirmVisible).toBe(false);
  });
});
