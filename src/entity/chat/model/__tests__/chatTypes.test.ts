import { isTradeProduct, isChatRoomListItem, isChatMessageResponse } from '../chatTypes';

describe('isTradeProduct', () => {
  const validProduct = {
    id: 1,
    title: '상품',
    images: [],
    createdAt: null,
    isSeller: false,
    isCompletable: true,
    isCompleted: false,
    isReserved: false,
  };

  it('유효한 TradeProduct이면 true를 반환한다', () => {
    expect(isTradeProduct(validProduct)).toBe(true);
  });

  it('null이면 false를 반환한다', () => {
    expect(isTradeProduct(null)).toBe(false);
  });

  it('object가 아니면 false를 반환한다', () => {
    expect(isTradeProduct('string')).toBe(false);
    expect(isTradeProduct(123)).toBe(false);
    expect(isTradeProduct(undefined)).toBe(false);
  });

  it('필수 필드가 누락되면 false를 반환한다', () => {
    const { id, ...withoutId } = validProduct;
    expect(isTradeProduct(withoutId)).toBe(false);
  });

  it('id가 number가 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, id: '1' })).toBe(false);
  });

  it('title이 string이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, title: 123 })).toBe(false);
  });

  it('images가 배열이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, images: {} })).toBe(false);
  });

  it('isSeller가 boolean이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, isSeller: 'false' })).toBe(false);
  });

  it('isCompletable이 boolean이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, isCompletable: 1 })).toBe(false);
  });

  it('isCompleted가 boolean이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, isCompleted: 0 })).toBe(false);
  });

  it('isReserved가 없으면 false를 반환한다', () => {
    const { isReserved, ...withoutIsReserved } = validProduct;
    expect(isTradeProduct(withoutIsReserved)).toBe(false);
  });

  it('isReserved가 boolean이 아니면 false를 반환한다', () => {
    expect(isTradeProduct({ ...validProduct, isReserved: 1 })).toBe(false);
  });
});

describe('isChatRoomListItem', () => {
  const validItem = {
    roomId: 1,
    member: { memberId: 1, nickname: '닉네임' },
    messageId: 1,
    lastMessage: '메시지',
  };

  it('필수 필드가 모두 있으면 true를 반환한다', () => {
    expect(isChatRoomListItem(validItem)).toBe(true);
  });

  it('null이면 false를 반환한다', () => {
    expect(isChatRoomListItem(null)).toBe(false);
  });

  it('object가 아니면 false를 반환한다', () => {
    expect(isChatRoomListItem('string')).toBe(false);
  });

  it('roomId가 없으면 false를 반환한다', () => {
    const { roomId, ...rest } = validItem;
    expect(isChatRoomListItem(rest)).toBe(false);
  });

  it('member가 없으면 false를 반환한다', () => {
    const { member, ...rest } = validItem;
    expect(isChatRoomListItem(rest)).toBe(false);
  });

  it('lastMessage가 없으면 false를 반환한다', () => {
    const { lastMessage, ...rest } = validItem;
    expect(isChatRoomListItem(rest)).toBe(false);
  });
});

describe('isChatMessageResponse', () => {
  const validMessage = {
    messageId: 1,
    roomId: 1,
    messageType: 'TEXT',
  };

  it('필수 필드가 모두 있으면 true를 반환한다', () => {
    expect(isChatMessageResponse(validMessage)).toBe(true);
  });

  it('null이면 false를 반환한다', () => {
    expect(isChatMessageResponse(null)).toBe(false);
  });

  it('object가 아니면 false를 반환한다', () => {
    expect(isChatMessageResponse(42)).toBe(false);
  });

  it('messageId가 없으면 false를 반환한다', () => {
    const { messageId, ...rest } = validMessage;
    expect(isChatMessageResponse(rest)).toBe(false);
  });

  it('roomId가 없으면 false를 반환한다', () => {
    const { roomId, ...rest } = validMessage;
    expect(isChatMessageResponse(rest)).toBe(false);
  });

  it('messageType이 없으면 false를 반환한다', () => {
    const { messageType, ...rest } = validMessage;
    expect(isChatMessageResponse(rest)).toBe(false);
  });
});
