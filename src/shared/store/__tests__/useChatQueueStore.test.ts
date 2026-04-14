import { useChatQueueStore, MESSAGE_STATUS } from '../useChatQueueStore';

const ROOM_A = 'room-1' as any;
const ROOM_B = 'room-2' as any;

const BASE_MESSAGE = {
  roomId: ROOM_A,
  content: '안녕하세요',
  messageType: 'TEXT' as any,
  imageIds: [],
};

beforeEach(() => {
  useChatQueueStore.setState({ pendingMessages: [] });
});

describe('addMessage', () => {
  it('메시지를 추가하고 tempId를 반환한다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);

    expect(typeof tempId).toBe('string');
    expect(tempId.length).toBeGreaterThan(0);

    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages).toHaveLength(1);
    expect(messages[0].tempId).toBe(tempId);
  });

  it('초기 status는 PENDING이다', () => {
    useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    const msg = useChatQueueStore.getState().pendingMessages[0];
    expect(msg.status).toBe(MESSAGE_STATUS.PENDING);
  });

  it('초기 retryCount는 0이다', () => {
    useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    const msg = useChatQueueStore.getState().pendingMessages[0];
    expect(msg.retryCount).toBe(0);
  });

  it('여러 메시지를 추가하면 순서대로 쌓인다', () => {
    const id1 = useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, content: '첫번째' });
    const id2 = useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, content: '두번째' });

    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages).toHaveLength(2);
    expect(messages[0].tempId).toBe(id1);
    expect(messages[1].tempId).toBe(id2);
  });

  it('tempId는 각 호출마다 고유하다', () => {
    const ids = Array.from({ length: 5 }, () =>
      useChatQueueStore.getState().addMessage(BASE_MESSAGE)
    );
    const unique = new Set(ids);
    expect(unique.size).toBe(5);
  });
});

describe('setStatus', () => {
  it('해당 tempId의 status를 변경한다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.SENDING);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.status).toBe(MESSAGE_STATUS.SENDING);
  });

  it('존재하지 않는 tempId는 다른 메시지에 영향을 주지 않는다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus('non-existent', MESSAGE_STATUS.SENT);

    const msg = useChatQueueStore.getState().pendingMessages[0];
    expect(msg.tempId).toBe(tempId);
    expect(msg.status).toBe(MESSAGE_STATUS.PENDING);
  });

  it('SENT 상태로 변경할 수 있다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.SENT);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.status).toBe(MESSAGE_STATUS.SENT);
  });

  it('FAILED 상태로 변경할 수 있다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.FAILED);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.status).toBe(MESSAGE_STATUS.FAILED);
  });
});

describe('removeMessage', () => {
  it('해당 tempId의 메시지를 삭제한다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().removeMessage(tempId);

    expect(useChatQueueStore.getState().pendingMessages).toHaveLength(0);
  });

  it('다른 메시지는 삭제되지 않는다', () => {
    const id1 = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    const id2 = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().removeMessage(id1);

    const messages = useChatQueueStore.getState().pendingMessages;
    expect(messages).toHaveLength(1);
    expect(messages[0].tempId).toBe(id2);
  });

  it('존재하지 않는 tempId 삭제 시 목록이 변하지 않는다', () => {
    useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().removeMessage('non-existent');

    expect(useChatQueueStore.getState().pendingMessages).toHaveLength(1);
  });
});

describe('retry', () => {
  it('retryCount를 1 증가시킨다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().retry(tempId);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.retryCount).toBe(1);
  });

  it('retry를 여러 번 호출하면 누적된다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().retry(tempId);
    useChatQueueStore.getState().retry(tempId);
    useChatQueueStore.getState().retry(tempId);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.retryCount).toBe(3);
  });

  it('status를 PENDING으로 되돌린다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.FAILED);
    useChatQueueStore.getState().retry(tempId);

    const msg = useChatQueueStore.getState().pendingMessages.find((m) => m.tempId === tempId);
    expect(msg?.status).toBe(MESSAGE_STATUS.PENDING);
  });
});

describe('getByRoom', () => {
  it('특정 방의 메시지만 반환한다', () => {
    useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, roomId: ROOM_A });
    useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, roomId: ROOM_B });
    useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, roomId: ROOM_A });

    const result = useChatQueueStore.getState().getByRoom(ROOM_A);
    expect(result).toHaveLength(2);
    result.forEach((m) => expect(m.roomId).toBe(ROOM_A));
  });

  it('메시지가 없으면 빈 배열을 반환한다', () => {
    expect(useChatQueueStore.getState().getByRoom(ROOM_A)).toEqual([]);
  });
});

describe('getRetryable', () => {
  it('PENDING과 FAILED 상태 메시지만 반환한다', () => {
    const id1 = useChatQueueStore.getState().addMessage(BASE_MESSAGE); // PENDING
    const id2 = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    const id3 = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(id2, MESSAGE_STATUS.FAILED);
    useChatQueueStore.getState().setStatus(id3, MESSAGE_STATUS.SENT);

    const result = useChatQueueStore.getState().getRetryable(ROOM_A);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.tempId)).toContain(id1);
    expect(result.map((m) => m.tempId)).toContain(id2);
  });

  it('SENDING, SENT 상태는 제외한다', () => {
    const tempId = useChatQueueStore.getState().addMessage(BASE_MESSAGE);
    useChatQueueStore.getState().setStatus(tempId, MESSAGE_STATUS.SENDING);

    expect(useChatQueueStore.getState().getRetryable(ROOM_A)).toHaveLength(0);
  });

  it('다른 방의 메시지는 포함하지 않는다', () => {
    useChatQueueStore.getState().addMessage({ ...BASE_MESSAGE, roomId: ROOM_B });

    expect(useChatQueueStore.getState().getRetryable(ROOM_A)).toHaveLength(0);
  });
});
