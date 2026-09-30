import { applyMessageUpdate, isSameMessageId, removeMessageById } from '../messageCache';
import type { ChatMessageResponse } from '../../model/chatTypes';

const message = (messageId: number, content = `메시지 ${messageId}`): ChatMessageResponse => ({
  messageId,
  roomId: 1,
  content,
  messageType: 'TEXT',
  createdAt: '2026-09-29T12:00:00.000Z',
  senderNickname: '나',
  senderId: 1,
  checked: false,
  isMine: true,
});

describe('isSameMessageId', () => {
  it('숫자와 문자열 id를 같은 값으로 본다', () => {
    expect(isSameMessageId(3, '3')).toBe(true);
    expect(isSameMessageId(3, 4)).toBe(false);
  });
});

describe('applyMessageUpdate', () => {
  it('해당 메시지의 내용과 수정 시각을 바꾼다', () => {
    const result = applyMessageUpdate([message(1), message(2)], {
      messageId: '2',
      content: '수정됨',
      editedAt: '2026-09-29T13:00:00.000Z',
    });

    expect(result?.[1]).toEqual(
      expect.objectContaining({ content: '수정됨', editedAt: '2026-09-29T13:00:00.000Z' })
    );
    expect(result?.[0]).toEqual(message(1));
  });

  it('대상 메시지가 없으면 같은 배열을 돌려준다', () => {
    const messages = [message(1)];
    expect(applyMessageUpdate(messages, { messageId: 9, content: 'x', editedAt: 'T' })).toBe(
      messages
    );
  });

  it('캐시가 없으면 그대로 undefined다', () => {
    expect(applyMessageUpdate(undefined, { messageId: 1, content: 'x', editedAt: 'T' })).toBe(
      undefined
    );
  });
});

describe('removeMessageById', () => {
  it('해당 메시지를 목록에서 뺀다', () => {
    expect(removeMessageById([message(1), message(2)], 1)).toEqual([message(2)]);
  });

  it('대상 메시지가 없으면 같은 배열을 돌려준다', () => {
    const messages = [message(1)];
    expect(removeMessageById(messages, 9)).toBe(messages);
  });
});
