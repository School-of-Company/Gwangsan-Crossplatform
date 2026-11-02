import {
  createNotificationDedupeGuard,
  parseNotificationData,
  resolveNotificationAction,
} from '../notificationRouting';

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

  it('NOTICE + sourceId이면 공지 상세로 push 액션을 반환한다', () => {
    expect(resolveNotificationAction({ alertType: 'NOTICE', sourceId: 4 })).toEqual({
      type: 'push',
      href: '/notice/4',
    });
  });

  it('FEEDBACK_ANSWER이면 feedbackId의 문의 상세로 push 액션을 반환한다', () => {
    expect(
      resolveNotificationAction({ alertType: 'FEEDBACK_ANSWER', feedbackId: 9, sourceId: 9 })
    ).toEqual({ type: 'push', href: '/feedback/9' });
  });

  it('FEEDBACK_ANSWER에 feedbackId가 없으면 sourceId로 문의 상세를 연다', () => {
    expect(resolveNotificationAction({ alertType: 'FEEDBACK_ANSWER', sourceId: 3 })).toEqual({
      type: 'push',
      href: '/feedback/3',
    });
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
    expect(resolveNotificationAction({ alertType: 'FEEDBACK_ANSWER' })).toEqual({ type: 'none' });
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

describe('parseNotificationData', () => {
  // 서버 ExpoPushAdapter.buildData는 모든 값을 문자열로 보낸다
  it.each(['CHATTING', 'RESERVATION_REMINDER', 'RESERVATION_CANCEL'])(
    '서버가 보내는 %s 푸시는 roomId로 채팅방 이동 액션이 된다',
    (alertType) => {
      const data = parseNotificationData({ alertType, sourceId: '42', roomId: '42' });

      expect(data).toEqual({ alertType, sourceId: 42, roomId: 42 });
      expect(resolveNotificationAction(data ?? undefined)).toEqual({ type: 'room', roomId: 42 });
    }
  );

  it('앱이 모르는 alertType이어도 파싱에 실패하지 않는다', () => {
    expect(parseNotificationData({ alertType: 'RECOMMENDATION', sourceId: '3' })).toEqual({
      alertType: 'RECOMMENDATION',
      sourceId: 3,
    });
  });

  it('FEEDBACK_ANSWER 푸시는 feedbackId로 문의 상세로 이동한다', () => {
    const data = parseNotificationData({
      alertType: 'FEEDBACK_ANSWER',
      sourceId: '5',
      feedbackId: '5',
    });

    expect(data).toEqual({ alertType: 'FEEDBACK_ANSWER', sourceId: 5, feedbackId: 5 });
    expect(resolveNotificationAction(data ?? undefined)).toEqual({
      type: 'push',
      href: '/feedback/5',
    });
  });

  it('TRADE_COMPLETE 푸시는 기존처럼 게시글 후기 경로로 이동한다', () => {
    const data = parseNotificationData({ alertType: 'TRADE_COMPLETE', sourceId: '9' });

    expect(resolveNotificationAction(data ?? undefined)).toEqual({
      type: 'push',
      href: '/post/9?review=1',
    });
  });

  it.each([
    ['음수 roomId', { alertType: 'CHATTING', roomId: '-1' }],
    ['숫자가 아닌 sourceId', { alertType: 'NOTICE', sourceId: '../admin' }],
    ['문자열이 아닌 alertType', { alertType: 123 }],
  ])('%s처럼 잘못된 값이면 null을 반환한다', (_label, payload) => {
    expect(parseNotificationData(payload)).toBeNull();
  });

  it('객체가 아니면 null을 반환한다', () => {
    expect(parseNotificationData(undefined)).toBeNull();
    expect(parseNotificationData('CHATTING')).toBeNull();
  });
});
