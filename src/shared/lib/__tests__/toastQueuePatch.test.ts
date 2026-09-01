import Toast from 'react-native-toast-message';
import { useToastQueueStore } from '../toastQueue';
import '../toastQueuePatch';

beforeEach(() => {
  useToastQueueStore.setState({ toasts: [] });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Toast.show 패치', () => {
  it('큐에 토스트를 추가한다', () => {
    Toast.show({ type: 'success', text1: '완료되었습니다' });

    const { toasts } = useToastQueueStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ type: 'success', text1: '완료되었습니다' });
  });

  it('빠르게 연달아 호출해도 이전 토스트를 지우지 않고 함께 쌓인다', () => {
    Toast.show({ type: 'success', text1: '첫번째' });
    Toast.show({ type: 'info', text1: '두번째' });

    const { toasts } = useToastQueueStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].text1).toBe('첫번째');
    expect(toasts[1].text1).toBe('두번째');
  });

  it('visibilityTime이 지나면 해당 토스트만 큐에서 제거된다', () => {
    Toast.show({ type: 'success', text1: '완료', visibilityTime: 2000 });

    jest.advanceTimersByTime(1999);
    expect(useToastQueueStore.getState().toasts).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(useToastQueueStore.getState().toasts).toHaveLength(0);
  });

  it('visibilityTime을 지정하지 않으면 기본값(4000ms) 이후 제거된다', () => {
    Toast.show({ type: 'success', text1: '완료' });

    jest.advanceTimersByTime(3999);
    expect(useToastQueueStore.getState().toasts).toHaveLength(1);

    jest.advanceTimersByTime(1);
    expect(useToastQueueStore.getState().toasts).toHaveLength(0);
  });

  it('autoHide가 false이면 시간이 지나도 제거되지 않는다', () => {
    Toast.show({ type: 'success', text1: '완료', autoHide: false });

    jest.advanceTimersByTime(10000);
    expect(useToastQueueStore.getState().toasts).toHaveLength(1);
  });
});

describe('Toast.hide 패치', () => {
  it('큐에 쌓인 모든 토스트를 제거한다', () => {
    Toast.show({ type: 'success', text1: '첫번째' });
    Toast.show({ type: 'info', text1: '두번째' });

    Toast.hide();

    expect(useToastQueueStore.getState().toasts).toEqual([]);
  });
});
