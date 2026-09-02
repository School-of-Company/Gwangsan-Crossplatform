import { useToastQueueStore } from '../toastQueue';

beforeEach(() => {
  useToastQueueStore.setState({ toasts: [] });
});

describe('push', () => {
  it('토스트를 큐에 추가하고 고유한 id를 반환한다', () => {
    const id = useToastQueueStore.getState().push({ type: 'success', text1: '완료' });

    expect(typeof id).toBe('number');
    expect(useToastQueueStore.getState().toasts).toEqual([
      expect.objectContaining({ id, type: 'success', text1: '완료' }),
    ]);
  });

  it('여러 번 호출하면 이전 토스트를 지우지 않고 뒤에 쌓는다', () => {
    useToastQueueStore.getState().push({ type: 'success', text1: '첫번째' });
    useToastQueueStore.getState().push({ type: 'info', text1: '두번째' });

    const { toasts } = useToastQueueStore.getState();
    expect(toasts).toHaveLength(2);
    expect(toasts[0].text1).toBe('첫번째');
    expect(toasts[1].text1).toBe('두번째');
  });

  it('호출할 때마다 서로 다른 id를 발급한다', () => {
    const firstId = useToastQueueStore.getState().push({ type: 'success', text1: 'a' });
    const secondId = useToastQueueStore.getState().push({ type: 'success', text1: 'b' });

    expect(firstId).not.toBe(secondId);
  });

  it('최대 개수를 넘으면 가장 오래된 토스트부터 제거한다', () => {
    for (let i = 0; i < 6; i += 1) {
      useToastQueueStore.getState().push({ type: 'info', text1: `toast-${i}` });
    }

    const { toasts } = useToastQueueStore.getState();
    expect(toasts).toHaveLength(4);
    expect(toasts.map((toast) => toast.text1)).toEqual([
      'toast-2',
      'toast-3',
      'toast-4',
      'toast-5',
    ]);
  });
});

describe('remove', () => {
  it('해당 id의 토스트만 제거한다', () => {
    const firstId = useToastQueueStore.getState().push({ type: 'success', text1: 'a' });
    const secondId = useToastQueueStore.getState().push({ type: 'success', text1: 'b' });

    useToastQueueStore.getState().remove(firstId);

    const { toasts } = useToastQueueStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(secondId);
  });

  it('존재하지 않는 id를 제거해도 에러 없이 무시한다', () => {
    useToastQueueStore.getState().push({ type: 'success', text1: 'a' });

    expect(() => useToastQueueStore.getState().remove(999999)).not.toThrow();
    expect(useToastQueueStore.getState().toasts).toHaveLength(1);
  });
});

describe('clear', () => {
  it('모든 토스트를 제거한다', () => {
    useToastQueueStore.getState().push({ type: 'success', text1: 'a' });
    useToastQueueStore.getState().push({ type: 'info', text1: 'b' });

    useToastQueueStore.getState().clear();

    expect(useToastQueueStore.getState().toasts).toEqual([]);
  });
});
