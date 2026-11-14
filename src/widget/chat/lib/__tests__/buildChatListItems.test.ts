import { buildChatListItems } from '../buildChatListItems';
import { MESSAGE_TYPE } from '~/shared/types/chatType';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

jest.mock('~/entity/chat', () => ({
  formatMessageTime: (createdAt: string) => createdAt.slice(0, 16),
  getMessageDateKey: (createdAt: string) => createdAt.slice(0, 10),
  formatDateDividerLabel: (createdAt: string) => `날짜-${createdAt.slice(0, 10)}`,
  isSystemMessage: (message: { messageType: string }) => message.messageType === 'SYSTEM',
}));

const message = (overrides: Partial<EnhancedChatMessage> = {}): EnhancedChatMessage => ({
  messageId: 1,
  roomId: 1,
  content: '메시지',
  messageType: MESSAGE_TYPE.TEXT,
  createdAt: '2026-05-28T01:00:00.000Z',
  images: [],
  senderNickname: '상대방',
  senderId: 10,
  checked: false,
  isMine: false,
  ...overrides,
});

const product = (overrides: Partial<TradeProduct> = {}): TradeProduct => ({
  id: 100,
  title: '거래 상품',
  images: [],
  createdAt: '2026-05-28T01:30:00.000Z',
  isSeller: false,
  isCompletable: true,
  isCompleted: false,
  isReserved: false,
  ...overrides,
});

const tradeEmbedConfig = (p: TradeProduct) => ({
  shouldShow: true,
  product: p,
  showButtons: false,
  otherPartyNickname: '상대방',
});

// 결과는 inverted 목록용(최신 → 오래된)이라 시간순으로 뒤집어 본다
const timeline = (items: ReturnType<typeof buildChatListItems>) =>
  [...items].reverse().map((item) => item.type);

describe('buildChatListItems', () => {
  it('메시지가 없으면 빈 배열을 반환한다', () => {
    expect(buildChatListItems({ messages: [] })).toEqual([]);
  });

  it('최신 항목이 앞에 오도록 뒤집고 날짜가 바뀌는 곳마다 구분선을 넣는다', () => {
    const items = buildChatListItems({
      messages: [
        message({ messageId: 1, createdAt: '2026-05-27T23:00:00.000Z' }),
        message({ messageId: 2, createdAt: '2026-05-28T01:00:00.000Z' }),
        message({ messageId: 3, createdAt: '2026-05-28T02:00:00.000Z' }),
      ],
    });

    expect(timeline(items)).toEqual([
      'dateDivider',
      'message',
      'dateDivider',
      'message',
      'message',
    ]);
    expect(items[0]).toMatchObject({ type: 'message', data: { messageId: 3 } });
  });

  it('SYSTEM 메시지는 말풍선이 아닌 system 항목이 되고 묶음 판단에서 이웃으로 치지 않는다', () => {
    const items = buildChatListItems({
      messages: [
        message({ messageId: 1, senderId: 10 }),
        message({
          messageId: 2,
          messageType: MESSAGE_TYPE.SYSTEM,
          content: '예약이 취소되었습니다',
        }),
        message({ messageId: 3, senderId: 10, createdAt: '2026-05-28T01:05:00.000Z' }),
      ],
    });

    expect(timeline(items)).toEqual(['dateDivider', 'message', 'system', 'message']);
    const last = items[0];
    expect(last).toMatchObject({ type: 'message', display: { showProfile: true } });
  });

  it('같은 상대가 연달아 보낸 메시지는 프로필을 한 번만 보이고 같은 분이면 앞 메시지의 시간을 숨긴다', () => {
    const items = buildChatListItems({
      messages: [message({ messageId: 1, senderId: 10 }), message({ messageId: 2, senderId: 10 })],
    });

    const [second, first] = items;
    expect(first).toMatchObject({
      display: { showProfile: true, isFollowedByGrouped: true, showTime: false },
    });
    expect(second).toMatchObject({
      display: { showProfile: false, isFollowedByGrouped: false, showTime: true },
    });
  });

  it('내가 보낸 마지막 메시지에만 isLastMine을 켠다', () => {
    const items = buildChatListItems({
      messages: [
        message({ messageId: 1, isMine: true }),
        message({ messageId: 2, isMine: true, createdAt: '2026-05-28T01:10:00.000Z' }),
        message({ messageId: 3, isMine: false, createdAt: '2026-05-28T01:20:00.000Z' }),
      ],
    });

    const mine = items.filter((item) => item.type === 'message' && item.data.isMine);
    expect(mine.map((item) => item.type === 'message' && item.display?.isLastMine)).toEqual([
      true,
      false,
    ]);
  });

  it('거래 요청 카드는 createdAt 위치의 메시지 사이에 끼워 넣는다', () => {
    const p = product({ createdAt: '2026-05-28T01:30:00.000Z' });
    const items = buildChatListItems({
      messages: [
        message({ messageId: 1, createdAt: '2026-05-28T01:00:00.000Z' }),
        message({ messageId: 2, createdAt: '2026-05-28T02:00:00.000Z' }),
      ],
      tradeEmbedConfig: tradeEmbedConfig(p),
    });

    expect(timeline(items)).toEqual(['dateDivider', 'message', 'trade', 'message']);
  });

  it('예약·완료 카드는 서버 시각이 없으면 목록 맨 끝에 붙인다', () => {
    const p = product({ isReserved: true, reservedAt: null });
    const reserved = buildChatListItems({
      messages: [message({ messageId: 1, createdAt: '2026-05-28T03:00:00.000Z' })],
      tradeEmbedConfig: { ...tradeEmbedConfig(p), shouldShow: false },
    });
    expect(timeline(reserved)).toEqual(['dateDivider', 'message', 'tradeReserved']);

    const completed = buildChatListItems({
      messages: [message({ messageId: 1, createdAt: '2026-05-28T03:00:00.000Z' })],
      tradeEmbedConfig: { ...tradeEmbedConfig(product({ isCompleted: true })), shouldShow: false },
      showReviewButton: true,
      hasReviewedTrade: true,
    });
    expect(completed[0]).toMatchObject({ type: 'tradeCompleted', data: { hasReviewed: true } });
  });

  it('예약·완료 시각이 있으면 그 시각의 메시지 사이에 끼워 넣는다', () => {
    const p = product({ isReserved: true, reservedAt: '2026-05-28T01:30:00.000Z' });
    const items = buildChatListItems({
      messages: [
        message({ messageId: 1, createdAt: '2026-05-28T01:00:00.000Z' }),
        message({ messageId: 2, createdAt: '2026-05-28T02:00:00.000Z' }),
      ],
      tradeEmbedConfig: { ...tradeEmbedConfig(p), shouldShow: false },
    });

    expect(timeline(items)).toEqual(['dateDivider', 'message', 'tradeReserved', 'message']);
  });
});
