import { useFooterVisibilityStore } from '../useFooterVisibilityStore';

beforeEach(() => {
  useFooterVisibilityStore.getState().reset();
});

describe('초기 상태', () => {
  it('isHidden이 false로 시작한다', () => {
    expect(useFooterVisibilityStore.getState().isHidden).toBe(false);
  });
});

describe('hide', () => {
  it('isHidden을 true로 만든다', () => {
    useFooterVisibilityStore.getState().hide();
    expect(useFooterVisibilityStore.getState().isHidden).toBe(true);
  });

  it('이미 숨겨진 상태에서 다시 호출해도 true를 유지한다', () => {
    useFooterVisibilityStore.getState().hide();
    useFooterVisibilityStore.getState().hide();
    expect(useFooterVisibilityStore.getState().isHidden).toBe(true);
  });
});

describe('show', () => {
  it('isHidden을 false로 만든다', () => {
    useFooterVisibilityStore.getState().hide();
    useFooterVisibilityStore.getState().show();
    expect(useFooterVisibilityStore.getState().isHidden).toBe(false);
  });

  it('이미 보이는 상태에서 다시 호출해도 false를 유지한다', () => {
    useFooterVisibilityStore.getState().show();
    expect(useFooterVisibilityStore.getState().isHidden).toBe(false);
  });
});

describe('reset', () => {
  it('숨겨진 상태를 초기값(false)으로 되돌린다', () => {
    useFooterVisibilityStore.getState().hide();
    useFooterVisibilityStore.getState().reset();
    expect(useFooterVisibilityStore.getState().isHidden).toBe(false);
  });
});
