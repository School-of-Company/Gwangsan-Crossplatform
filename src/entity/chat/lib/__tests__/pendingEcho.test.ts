import { matchPendingEcho } from '../pendingEcho';
import { MESSAGE_STATUS, type PendingMessage } from '~/shared/store/useChatQueueStore';
import type { ChatMessageResponse } from '../../model/chatTypes';

const pending = (tempId: string, overrides: Partial<PendingMessage> = {}): PendingMessage => ({
  tempId,
  roomId: 1,
  content: 'ㅋㅋ',
  messageType: 'TEXT',
  imageIds: [],
  status: MESSAGE_STATUS.SENDING,
  createdAt: '2026-11-01T00:00:00.000Z',
  retryCount: 0,
  ...overrides,
});

const echo = (overrides: Partial<ChatMessageResponse> = {}) =>
  ({
    messageId: 10,
    roomId: 1,
    content: 'ㅋㅋ',
    messageType: 'TEXT',
    isMine: true,
    ...overrides,
  }) as ChatMessageResponse;

describe('matchPendingEcho', () => {
  it('같은 방·타입·내용의 가장 먼저 보낸 대기 메시지를 고른다', () => {
    expect(matchPendingEcho([pending('a'), pending('b')], echo())?.tempId).toBe('a');
  });

  it('내가 보낸 echo가 아니면 매칭하지 않는다', () => {
    expect(matchPendingEcho([pending('a')], echo({ isMine: false }))).toBeUndefined();
  });

  it('같은 이벤트를 여러 구독자가 처리해도, 앞에서 지운 뒤 내용이 같은 다른 대기 메시지를 고르지 않는다', () => {
    const message = echo();

    expect(matchPendingEcho([pending('a'), pending('b')], message)?.tempId).toBe('a');
    // 첫 구독자가 'a'를 지운 뒤의 대기열
    expect(matchPendingEcho([pending('b')], message)?.tempId).toBe('a');
  });

  it('IMAGE는 echo의 이미지 id가 모두 같을 때 매칭한다', () => {
    const queue = [pending('img', { messageType: 'IMAGE', content: null, imageIds: [1, 2] })];

    expect(
      matchPendingEcho(
        queue,
        echo({
          messageType: 'IMAGE',
          images: [
            { imageId: 2, imageUrl: '' },
            { imageId: 1, imageUrl: '' },
          ],
        })
      )?.tempId
    ).toBe('img');
    expect(
      matchPendingEcho(
        queue,
        echo({ messageType: 'IMAGE', images: [{ imageId: 3, imageUrl: '' }] })
      )
    ).toBeUndefined();
  });
});
