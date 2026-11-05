import {
  addMessageToPages,
  applyMessageUpdate,
  createMessagePages,
  flattenMessagePages,
  getNewestMessage,
  isSameMessageId,
  keepNewestPage,
  mapMessagePages,
  mergeNewerCachedMessages,
  removeMessageById,
  seedMessagePagesFromSnapshot,
  toMessagePage,
  type ChatMessagePages,
} from '../messageCache';
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

const at = (messageId: number, minute: number): ChatMessageResponse => ({
  ...message(messageId),
  createdAt: `2026-09-29T12:${String(minute).padStart(2, '0')}:00`,
});

// pages[0]이 최신 페이지: [3, 4], 이전 페이지: [1, 2]
const twoPages = (): ChatMessagePages => ({
  pages: [
    {
      messages: [at(3, 3), at(4, 4)],
      nextCursor: { lastCreatedAt: at(3, 3).createdAt, lastMessageId: 3 },
    },
    { messages: [at(1, 1), at(2, 2)], nextCursor: null },
  ],
  pageParams: [null, { lastCreatedAt: at(3, 3).createdAt, lastMessageId: 3 }],
});

describe('toMessagePage', () => {
  it('서버의 최신순 응답을 오래된 → 최신 순으로 정렬하고, 가득 찬 페이지면 가장 오래된 메시지로 커서를 만든다', () => {
    const page = toMessagePage([at(3, 3), at(2, 2), at(1, 1)], 3);

    expect(page.messages.map((m) => m.messageId)).toEqual([1, 2, 3]);
    expect(page.nextCursor).toEqual({ lastCreatedAt: at(1, 1).createdAt, lastMessageId: 1 });
  });

  it('받은 개수가 limit보다 적으면 더 이전 페이지가 없다', () => {
    expect(toMessagePage([at(1, 1)], 3).nextCursor).toBeNull();
    expect(toMessagePage([], 3).nextCursor).toBeNull();
  });
});

describe('flattenMessagePages', () => {
  it('이전 페이지부터 이어 붙여 오래된 → 최신 순으로 돌려준다', () => {
    expect(flattenMessagePages(twoPages()).map((m) => m.messageId)).toEqual([1, 2, 3, 4]);
  });

  it('페이지 경계에서 겹친 메시지는 한 번만 남긴다', () => {
    const data = twoPages();
    const overlapped: ChatMessagePages = {
      ...data,
      pages: [{ ...data.pages[0], messages: [at(2, 2), ...data.pages[0].messages] }, data.pages[1]],
    };

    expect(flattenMessagePages(overlapped).map((m) => m.messageId)).toEqual([1, 2, 3, 4]);
  });

  it('캐시가 없으면 빈 배열', () => {
    expect(flattenMessagePages(undefined)).toEqual([]);
  });
});

describe('addMessageToPages', () => {
  it('새 메시지는 최신 페이지에 시간순으로 넣는다', () => {
    const result = addMessageToPages(twoPages(), at(5, 5));

    expect(result.pages[0].messages.map((m) => m.messageId)).toEqual([3, 4, 5]);
    expect(getNewestMessage(result)?.messageId).toBe(5);
  });

  it('이미 어느 페이지에든 있는 메시지면 그대로 둔다', () => {
    const data = twoPages();
    expect(addMessageToPages(data, at(1, 1))).toBe(data);
  });

  it('캐시가 없으면 한 페이지짜리 캐시를 만든다', () => {
    expect(addMessageToPages(undefined, at(1, 1))).toEqual(
      createMessagePages({ messages: [at(1, 1)], nextCursor: null })
    );
  });
});

describe('mapMessagePages', () => {
  it('이전 페이지에 있는 메시지의 수정도 반영한다', () => {
    const result = mapMessagePages(twoPages(), (messages) =>
      applyMessageUpdate(messages, { messageId: 1, content: '수정됨', editedAt: 'x' })
    );

    expect(flattenMessagePages(result)[0].content).toBe('수정됨');
  });

  it('이전 페이지의 메시지 삭제도 반영하고, 바뀌지 않은 페이지는 같은 참조를 유지한다', () => {
    const data = twoPages();
    const result = mapMessagePages(data, (messages) => removeMessageById(messages, 2));

    expect(flattenMessagePages(result).map((m) => m.messageId)).toEqual([1, 3, 4]);
    expect(result?.pages[0]).toBe(data.pages[0]);
  });

  it('바뀐 게 없으면 같은 캐시를 돌려준다', () => {
    const data = twoPages();
    expect(mapMessagePages(data, (messages) => removeMessageById(messages, 99))).toBe(data);
  });
});

describe('keepNewestPage', () => {
  it('최신 페이지만 남긴다', () => {
    const result = keepNewestPage(twoPages());

    expect(result?.pages).toHaveLength(1);
    expect(result?.pageParams).toEqual([null]);
  });
});

describe('seedMessagePagesFromSnapshot', () => {
  it('snapshot이 더 최신이면 snapshot 한 페이지로 바꾼다', () => {
    const result = seedMessagePagesFromSnapshot(twoPages(), [at(9, 9), at(8, 8)], 30);

    expect(flattenMessagePages(result).map((m) => m.messageId)).toEqual([8, 9]);
  });

  it('기존 캐시가 더 최신이면(방금 보낸 메시지가 snapshot에 없음, #610) 기존 캐시를 유지한다', () => {
    const data = twoPages();
    expect(seedMessagePagesFromSnapshot(data, [at(1, 1)], 30)).toBe(data);
  });
});

describe('mergeNewerCachedMessages', () => {
  const page = () => toMessagePage([at(4, 4), at(3, 3)], 2);

  it('응답의 최신 시각보다 늦은 캐시 메시지를 시간순으로 더한다', () => {
    const current = addMessageToPages(twoPages(), at(5, 5));

    const result = mergeNewerCachedMessages(page(), current);

    expect(result.messages.map((m) => m.messageId)).toEqual([3, 4, 5]);
  });

  it('응답의 커서는 그대로 둔다', () => {
    const current = addMessageToPages(twoPages(), at(5, 5));

    expect(mergeNewerCachedMessages(page(), current).nextCursor).toEqual(page().nextCursor);
  });

  it('응답 시각 이하의 캐시 메시지는 ID가 달라도 더하지 않는다', () => {
    const current = addMessageToPages(twoPages(), { ...at(4, 4), messageId: 'socket-4' });

    const result = mergeNewerCachedMessages(page(), current);

    expect(result.messages.map((m) => m.messageId)).toEqual([3, 4]);
  });

  it('응답에 이미 있는 메시지는 시각이 더 늦어도 중복으로 더하지 않는다', () => {
    const current = addMessageToPages(twoPages(), { ...at(4, 6), messageId: '4' });

    expect(mergeNewerCachedMessages(page(), current).messages.map((m) => m.messageId)).toEqual([
      3, 4,
    ]);
  });

  it('더할 메시지가 없으면 같은 페이지를 돌려준다', () => {
    const response = page();

    expect(mergeNewerCachedMessages(response, twoPages())).toBe(response);
    expect(mergeNewerCachedMessages(response, undefined)).toBe(response);
  });
});
