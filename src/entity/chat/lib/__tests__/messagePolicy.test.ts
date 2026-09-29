import { canEditMessage, canModifyMessage, MESSAGE_MODIFY_WINDOW_MS } from '../messagePolicy';
import { MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { EnhancedChatMessage } from '../../model/useChatMessages';

const NOW = new Date('2026-09-29T12:00:00.000Z').getTime();

const message = (overrides: Partial<EnhancedChatMessage> = {}): EnhancedChatMessage => ({
  messageId: 1,
  roomId: 1,
  content: '안녕하세요',
  messageType: 'TEXT',
  createdAt: new Date(NOW - 60_000).toISOString(),
  senderNickname: '나',
  senderId: 1,
  checked: false,
  isMine: true,
  status: MESSAGE_STATUS.SENT,
  ...overrides,
});

describe('canModifyMessage', () => {
  it('내가 보낸 24시간 이내의 전송 완료 메시지는 수정/삭제할 수 있다', () => {
    expect(canModifyMessage(message(), NOW)).toBe(true);
  });

  it('상대방 메시지는 수정/삭제할 수 없다', () => {
    expect(canModifyMessage(message({ isMine: false }), NOW)).toBe(false);
  });

  it('보낸 지 24시간이 지난 메시지는 수정/삭제할 수 없다', () => {
    const createdAt = new Date(NOW - MESSAGE_MODIFY_WINDOW_MS).toISOString();
    expect(canModifyMessage(message({ createdAt }), NOW)).toBe(false);
  });

  it('24시간이 되기 직전 메시지는 수정/삭제할 수 있다', () => {
    const createdAt = new Date(NOW - MESSAGE_MODIFY_WINDOW_MS + 1000).toISOString();
    expect(canModifyMessage(message({ createdAt }), NOW)).toBe(true);
  });

  it.each([MESSAGE_STATUS.SENDING, MESSAGE_STATUS.PENDING, MESSAGE_STATUS.FAILED])(
    '%s 상태의 메시지는 수정/삭제할 수 없다',
    (status) => {
      expect(canModifyMessage(message({ status }), NOW)).toBe(false);
    }
  );

  it('임시 tempId가 있는 메시지는 수정/삭제할 수 없다', () => {
    expect(canModifyMessage(message({ tempId: 'temp-1' }), NOW)).toBe(false);
  });

  it('createdAt을 해석할 수 없으면 수정/삭제할 수 없다', () => {
    expect(canModifyMessage(message({ createdAt: 'invalid' }), NOW)).toBe(false);
  });

  it('이미지 메시지도 삭제 대상이다', () => {
    expect(canModifyMessage(message({ messageType: 'IMAGE', content: null }), NOW)).toBe(true);
  });
});

describe('canEditMessage', () => {
  it('텍스트 메시지만 수정할 수 있다', () => {
    expect(canEditMessage(message(), NOW)).toBe(true);
    expect(canEditMessage(message({ messageType: 'IMAGE', content: null }), NOW)).toBe(false);
  });

  it('수정/삭제할 수 없는 메시지는 수정도 할 수 없다', () => {
    expect(canEditMessage(message({ isMine: false }), NOW)).toBe(false);
  });
});
