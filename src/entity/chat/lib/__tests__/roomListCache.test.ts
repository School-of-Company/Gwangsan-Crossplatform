import {
  applyIncomingMessageToRooms,
  applyMessageEditToRooms,
  applyRoomListUpdate,
  applyTransactionStateToRooms,
  isLastMessageOfRoom,
  patchRoomProductTransaction,
} from '../roomListCache';
import type {
  ChatMessageResponse,
  ChatRoomListItem,
  ChatRoomWithProduct,
} from '../../model/chatTypes';

const room = (overrides: Partial<ChatRoomListItem> = {}): ChatRoomListItem =>
  ({
    roomId: 1,
    member: { memberId: 2, nickname: '상대' },
    messageId: 10,
    lastMessage: '이전',
    lastMessageType: 'TEXT',
    lastMessageTime: '2026-11-01T10:00:00',
    unreadMessageCount: 0,
    product: { productId: 5, title: '상품', images: [], isCompleted: false, isReserved: false },
    ...overrides,
  }) as ChatRoomListItem;

const message = (overrides: Partial<ChatMessageResponse> = {}) =>
  ({
    messageId: 11,
    roomId: 1,
    content: '새 메시지',
    messageType: 'TEXT',
    createdAt: '2026-11-01T10:05:00',
    isMine: false,
    ...overrides,
  }) as ChatMessageResponse;

describe('applyIncomingMessageToRooms', () => {
  it('상대 메시지는 미리보기를 바꾸고 안 읽은 수를 늘린다', () => {
    const [next] = applyIncomingMessageToRooms([room()], message(), undefined)!;

    expect(next).toEqual(
      expect.objectContaining({ messageId: 11, lastMessage: '새 메시지', unreadMessageCount: 1 })
    );
  });

  it('보고 있는 방이면 안 읽은 수를 0으로 둔다', () => {
    const [next] = applyIncomingMessageToRooms([room({ unreadMessageCount: 3 })], message(), 1)!;
    expect(next.unreadMessageCount).toBe(0);
  });

  it('내 메시지·SYSTEM 메시지는 안 읽은 수를 늘리지 않는다', () => {
    expect(
      applyIncomingMessageToRooms([room()], message({ isMine: true }), undefined)![0]
        .unreadMessageCount
    ).toBe(0);
    expect(
      applyIncomingMessageToRooms([room()], message({ messageType: 'SYSTEM' }), undefined)![0]
        .unreadMessageCount
    ).toBe(0);
  });

  it('목록보다 오래된 메시지나 이미 반영한 메시지는 무시한다', () => {
    const rooms = [room()];
    expect(
      applyIncomingMessageToRooms(
        rooms,
        message({ createdAt: '2026-11-01T09:00:00' }),
        undefined
      )![0]
    ).toBe(rooms[0]);
    expect(applyIncomingMessageToRooms(rooms, message({ messageId: 10 }), undefined)![0]).toBe(
      rooms[0]
    );
  });

  it('이미지 메시지는 "(사진)"으로 보여준다', () => {
    expect(
      applyIncomingMessageToRooms([room()], message({ content: null }), undefined)![0].lastMessage
    ).toBe('(사진)');
  });
});

describe('applyRoomListUpdate', () => {
  it('해당 방의 마지막 메시지 정보를 바꾼다', () => {
    const [next] = applyRoomListUpdate([room()], {
      roomId: 1,
      lastMessage: '갱신',
      lastMessageType: 'TEXT',
      lastMessageTime: '2026-11-01T11:00:00',
    })!;
    expect(next.lastMessage).toBe('갱신');
  });
});

describe('patchRoomProductTransaction', () => {
  const roomData = (): ChatRoomWithProduct =>
    ({
      product: { id: 5, isSeller: true, isCompleted: false, isReserved: false, createdAt: 'x' },
      messages: [],
    }) as unknown as ChatRoomWithProduct;

  it('상품이 없으면 그대로 두고 patched: false', () => {
    const result = patchRoomProductTransaction(
      { product: null, messages: [] },
      { roomId: 1, productId: 5, isCompleted: false, createdAt: null }
    );
    expect(result.patched).toBe(false);
  });

  it('예약 여부가 바뀌면 reservationChanged: true', () => {
    const result = patchRoomProductTransaction(roomData(), {
      roomId: 1,
      productId: 5,
      isCompleted: false,
      isReserved: true,
      createdAt: null,
    });
    expect(result.patched).toBe(true);
    expect(result.reservationChanged).toBe(true);
    expect(result.next?.product?.isReserved).toBe(true);
    expect(result.next?.product?.createdAt).toBeNull();
  });

  it('isCompletable이 없으면 요청한 쪽이 아닌 사람에게만 완료 가능으로 계산한다', () => {
    const payload = { roomId: 1, productId: 5, isCompleted: false, createdAt: 'c' };
    expect(
      patchRoomProductTransaction(roomData(), { ...payload, requestedBySeller: true }).next?.product
        ?.isCompletable
    ).toBe(false);
    expect(
      patchRoomProductTransaction(roomData(), { ...payload, requestedBySeller: false }).next
        ?.product?.isCompletable
    ).toBe(true);
  });
});

describe('applyTransactionStateToRooms', () => {
  it('바뀐 게 없으면 같은 배열을 돌려준다', () => {
    const rooms = [room()];
    expect(
      applyTransactionStateToRooms(rooms, {
        roomId: 1,
        productId: 5,
        isCompleted: false,
        createdAt: null,
      })
    ).toBe(rooms);
  });

  it('완료·예약 상태를 상품 정보에 반영한다', () => {
    const [next] = applyTransactionStateToRooms([room()], {
      roomId: 1,
      productId: 5,
      isCompleted: true,
      isReserved: true,
      createdAt: null,
    })!;
    expect(next.product).toEqual(expect.objectContaining({ isCompleted: true, isReserved: true }));
  });
});

describe('applyMessageEditToRooms / isLastMessageOfRoom', () => {
  it('마지막 메시지가 수정되면 미리보기를 바꾼다(id 표현이 달라도)', () => {
    const [next] = applyMessageEditToRooms([room()], {
      roomId: 1,
      messageId: '10',
      content: '수정됨',
    })!;
    expect(next.lastMessage).toBe('수정됨');
  });

  it('마지막 메시지인지 판별한다', () => {
    expect(isLastMessageOfRoom([room()], 1, '10')).toBe(true);
    expect(isLastMessageOfRoom([room()], 1, 9)).toBe(false);
    expect(isLastMessageOfRoom(undefined, 1, 10)).toBe(false);
  });
});
