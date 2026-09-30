import { createNotificationDedupeGuard, resolveNotificationAction } from '../notificationRouting';

describe('resolveNotificationAction', () => {
  it('CHTTING_REQUEST + sourceId이면 chatEntry 액션을 반환한다', () => {
    const action = resolveNotificationAction({
      alertType: 'CHTTING_REQUEST',
      sourceId: 7,
    });
    expect(action).toEqual({ type: 'chatEntry', productId: 7 });
  });

  it('roomId가 있으면 alertType과 무관하게 room 액션을 반환한다', () => {
    const action = resolveNotificationAction({ roomId: 42 });
    expect(action).toEqual({ type: 'room', roomId: 42 });
  });

  it('roomId가 CHTTING_REQUEST보다 우선순위가 낮다 (CHTTING_REQUEST가 먼저 매칭)', () => {
    const action = resolveNotificationAction({
      alertType: 'CHTTING_REQUEST',
      sourceId: 1,
      roomId: 42,
    });
    expect(action).toEqual({ type: 'chatEntry', productId: 1 });
  });

  it('TRADE_COMPLETE + sourceId이면 후기 작성 화면으로 push 액션을 반환한다', () => {
    const action = resolveNotificationAction({
      alertType: 'TRADE_COMPLETE',
      sourceId: 10,
    });
    expect(action).toEqual({ type: 'push', href: '/post/10?review=1' });
  });

  it('REVIEW + sourceId이면 거래취소 화면으로 push 액션을 반환한다', () => {
    const action = resolveNotificationAction({
      alertType: 'REVIEW',
      sourceId: 5,
    });
    expect(action).toEqual({ type: 'push', href: '/cancelTrade/5' });
  });

  it('매칭되는 조건이 없으면 none 액션을 반환한다', () => {
    expect(resolveNotificationAction({ alertType: 'NOTICE' })).toEqual({ type: 'none' });
    expect(resolveNotificationAction(undefined)).toEqual({ type: 'none' });
  });

  it('sourceId 없이 CHTTING_REQUEST/TRADE_COMPLETE/REVIEW만 있으면 none을 반환한다', () => {
    expect(resolveNotificationAction({ alertType: 'CHTTING_REQUEST' })).toEqual({
      type: 'none',
    });
    expect(resolveNotificationAction({ alertType: 'TRADE_COMPLETE' })).toEqual({
      type: 'none',
    });
    expect(resolveNotificationAction({ alertType: 'REVIEW' })).toEqual({ type: 'none' });
  });
});

describe('createNotificationDedupeGuard', () => {
  it('같은 id를 두 번째 처리하려 하면 false를 반환한다', () => {
    const guard = createNotificationDedupeGuard();
    expect(guard.shouldProcess('abc')).toBe(true);
    expect(guard.shouldProcess('abc')).toBe(false);
  });

  it('다른 id는 각각 독립적으로 처리를 허용한다', () => {
    const guard = createNotificationDedupeGuard();
    expect(guard.shouldProcess('a')).toBe(true);
    expect(guard.shouldProcess('b')).toBe(true);
    expect(guard.shouldProcess('a')).toBe(false);
  });

  it('id가 없으면 (null/undefined) 항상 처리를 허용한다', () => {
    const guard = createNotificationDedupeGuard();
    expect(guard.shouldProcess(undefined)).toBe(true);
    expect(guard.shouldProcess(undefined)).toBe(true);
    expect(guard.shouldProcess(null)).toBe(true);
  });
});
