import { useReadRoomsStore } from '../useReadRoomsStore';

beforeEach(() => {
  useReadRoomsStore.setState({ readMessageIds: {} });
});

describe('markRead', () => {
  it('해당 방의 마지막으로 읽은 메시지 id를 기록한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({ 'room-1': 5 });
  });

  it('숫자 roomId도 문자열 키로 저장한다', () => {
    useReadRoomsStore.getState().markRead(1, 10);

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({ '1': 10 });
  });

  it('같은 방에 다시 markRead 하면 값을 덮어쓴다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().markRead('room-1', 8);

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({ 'room-1': 8 });
  });

  it('여러 방의 읽음 상태를 독립적으로 유지한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().markRead('room-2', 9);

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({
      'room-1': 5,
      'room-2': 9,
    });
  });
});

describe('clearRead', () => {
  it('해당 방의 읽음 상태를 제거한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().clearRead('room-1');

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({});
  });

  it('다른 방의 읽음 상태는 유지한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().markRead('room-2', 9);
    useReadRoomsStore.getState().clearRead('room-1');

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({ 'room-2': 9 });
  });

  it('기록이 없는 방을 지워도 오류 없이 상태를 유지한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().clearRead('room-does-not-exist');

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({ 'room-1': 5 });
  });

  it('빈 상태에서 clearRead를 호출해도 오류가 발생하지 않는다', () => {
    expect(() => useReadRoomsStore.getState().clearRead('room-1')).not.toThrow();
    expect(useReadRoomsStore.getState().readMessageIds).toEqual({});
  });
});

describe('isRead', () => {
  it('마지막으로 읽은 메시지와 동일하면 true를 반환한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);

    expect(useReadRoomsStore.getState().isRead('room-1', 5)).toBe(true);
  });

  it('마지막으로 읽은 메시지와 다르면 false를 반환한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);

    expect(useReadRoomsStore.getState().isRead('room-1', 6)).toBe(false);
  });

  it('기록이 없는 방은 false를 반환한다', () => {
    expect(useReadRoomsStore.getState().isRead('room-1', 5)).toBe(false);
  });

  it('숫자와 문자열 messageId를 문자열로 비교하여 동일하게 취급한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);

    expect(useReadRoomsStore.getState().isRead('room-1', '5')).toBe(true);
  });

  it('roomId가 숫자와 문자열이어도 동일한 방으로 취급한다', () => {
    useReadRoomsStore.getState().markRead(1, 5);

    expect(useReadRoomsStore.getState().isRead('1', 5)).toBe(true);
  });
});

describe('reset', () => {
  it('모든 읽음 상태를 초기화한다', () => {
    useReadRoomsStore.getState().markRead('room-1', 5);
    useReadRoomsStore.getState().markRead('room-2', 9);

    useReadRoomsStore.getState().reset();

    expect(useReadRoomsStore.getState().readMessageIds).toEqual({});
  });

  it('빈 상태에서 reset을 호출해도 오류가 발생하지 않는다', () => {
    expect(() => useReadRoomsStore.getState().reset()).not.toThrow();
    expect(useReadRoomsStore.getState().readMessageIds).toEqual({});
  });
});
