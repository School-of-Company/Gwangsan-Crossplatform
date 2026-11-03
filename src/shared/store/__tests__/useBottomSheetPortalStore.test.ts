import { useBottomSheetPortalStore } from '../useBottomSheetPortalStore';

beforeEach(() => {
  useBottomSheetPortalStore.getState().reset();
});

describe('useBottomSheetPortalStore', () => {
  it('closeAll은 등록된 닫기 콜백을 모두 호출한다', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { setCloser, closeAll } = useBottomSheetPortalStore.getState();

    setCloser('a', first);
    setCloser('b', second);
    closeAll();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('setCloser(id, null)과 removeSheet는 닫기 콜백을 지운다', () => {
    const close = jest.fn();
    const { setCloser, removeSheet, closeAll } = useBottomSheetPortalStore.getState();

    setCloser('a', close);
    setCloser('a', null);
    setCloser('b', close);
    removeSheet('b');
    closeAll();

    expect(close).not.toHaveBeenCalled();
    expect(useBottomSheetPortalStore.getState().closers).toEqual({});
  });
});
