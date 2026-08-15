import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatRoomItem } from '../index';
import type { ChatRoomListItem } from '../../../model/chatTypes';

jest.mock('@/shared/lib/formatDate', () => ({
  formatDate: jest.fn(() => '방금 전'),
}));

const baseRoom: ChatRoomListItem = {
  roomId: 1,
  member: { memberId: 5, nickname: '판매자' },
  messageId: 100,
  lastMessage: '안녕하세요',
  lastMessageType: 'TEXT',
  lastMessageTime: '2026-05-28T01:00:00.000Z',
  unreadMessageCount: 0,
  product: {
    productId: 10,
    title: '상품 제목',
    images: [{ imageId: 1, imageUrl: 'https://example.com/product.png' }],
  },
};

describe('ChatRoomItem', () => {
  it('상품 제목, 상대방 닉네임, 마지막 메시지, 시간을 표시한다', () => {
    const { getByText } = render(<ChatRoomItem room={baseRoom} onPress={jest.fn()} />);

    expect(getByText('상품 제목')).toBeTruthy();
    expect(getByText('판매자')).toBeTruthy();
    expect(getByText('안녕하세요')).toBeTruthy();
    expect(getByText('방금 전')).toBeTruthy();
  });

  it('lastMessageType이 IMAGE면 사진 안내 문구를 표시한다', () => {
    const room = { ...baseRoom, lastMessageType: 'IMAGE' as const };
    const { getByText, queryByText } = render(<ChatRoomItem room={room} onPress={jest.fn()} />);

    expect(getByText('📷 사진을 보냈습니다.')).toBeTruthy();
    expect(queryByText('안녕하세요')).toBeNull();
  });

  it('unreadMessageCount가 0이면 뱃지를 표시하지 않는다', () => {
    const { queryByText } = render(<ChatRoomItem room={baseRoom} onPress={jest.fn()} />);

    expect(queryByText('0')).toBeNull();
  });

  it('unreadMessageCount가 있으면 뱃지에 숫자를 표시한다', () => {
    const room = { ...baseRoom, unreadMessageCount: 3 };
    const { getByText } = render(<ChatRoomItem room={room} onPress={jest.fn()} />);

    expect(getByText('3')).toBeTruthy();
  });

  it('상품 이미지가 있으면 해당 이미지를 사용한다', () => {
    const { UNSAFE_getAllByType } = render(<ChatRoomItem room={baseRoom} onPress={jest.fn()} />);
    const { Image } = require('react-native');

    const images = UNSAFE_getAllByType(Image);
    expect(images[0].props.source).toEqual({ uri: 'https://example.com/product.png' });
  });

  it('상품 이미지가 없으면 기본 프로필 이미지를 사용한다', () => {
    const room = { ...baseRoom, product: { ...baseRoom.product, images: [] } };
    const { UNSAFE_getAllByType } = render(<ChatRoomItem room={room} onPress={jest.fn()} />);
    const { Image } = require('react-native');

    const images = UNSAFE_getAllByType(Image);
    expect(images[0].props.source).not.toEqual({ uri: undefined });
    expect(typeof images[0].props.source).not.toBe('string');
  });

  it('isCompleted면 거래 완료 태그를 표시한다', () => {
    const room = { ...baseRoom, product: { ...baseRoom.product, isCompleted: true } };
    const { getByTestId } = render(<ChatRoomItem room={room} onPress={jest.fn()} />);

    expect(getByTestId('trade-completed-tag')).toBeTruthy();
  });

  it('isCompleted가 아니면 거래 완료 태그를 표시하지 않는다', () => {
    const { queryByTestId } = render(<ChatRoomItem room={baseRoom} onPress={jest.fn()} />);

    expect(queryByTestId('trade-completed-tag')).toBeNull();
  });

  it('누르면 onPress에 roomId를 전달한다', () => {
    const onPress = jest.fn();
    const { getByText } = render(<ChatRoomItem room={baseRoom} onPress={onPress} />);

    fireEvent.press(getByText('상품 제목'));

    expect(onPress).toHaveBeenCalledWith(1);
  });
});
