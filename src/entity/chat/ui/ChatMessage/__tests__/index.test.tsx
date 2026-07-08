import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatMessage } from '../index';
import type { ChatMessageResponse } from '../../../model/chatTypes';

jest.mock('@/shared/lib/formatDate', () => ({
  formatDate: jest.fn(() => '방금 전'),
}));

const baseMessage: ChatMessageResponse = {
  messageId: 1,
  roomId: 1,
  content: '안녕하세요',
  messageType: 'TEXT',
  createdAt: '2026-05-28T01:00:00.000Z',
  senderNickname: '상대방',
  senderId: 10,
  checked: false,
  isMine: false,
};

describe('ChatMessage', () => {
  it('상대방 텍스트 메시지는 발신자 닉네임과 내용을 표시한다', () => {
    const { getByText } = render(<ChatMessage message={baseMessage} />);

    expect(getByText('상대방')).toBeTruthy();
    expect(getByText('안녕하세요')).toBeTruthy();
    expect(getByText('방금 전')).toBeTruthy();
  });

  it('내가 보낸 텍스트 메시지는 발신자 닉네임을 표시하지 않는다', () => {
    const message: ChatMessageResponse = { ...baseMessage, isMine: true, content: '내 메시지' };
    const { getByText, queryByText } = render(<ChatMessage message={message} />);

    expect(queryByText('상대방')).toBeNull();
    expect(getByText('내 메시지')).toBeTruthy();
  });

  it('IMAGE 타입 메시지는 이미지를 렌더링한다', () => {
    const message: ChatMessageResponse = {
      ...baseMessage,
      messageType: 'IMAGE',
      content: null,
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.png' },
        { imageId: 2, imageUrl: 'https://example.com/2.png' },
      ],
    };

    const { UNSAFE_getAllByType } = render(<ChatMessage message={message} />);
    const { Image } = require('react-native');

    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
  });

  it('IMAGE 타입 메시지에 content가 있으면 캡션도 함께 표시한다', () => {
    const message: ChatMessageResponse = {
      ...baseMessage,
      messageType: 'IMAGE',
      content: '사진이에요',
      images: [{ imageId: 1, imageUrl: 'https://example.com/1.png' }],
    };

    const { getByText } = render(<ChatMessage message={message} />);

    expect(getByText('사진이에요')).toBeTruthy();
  });

  it('IMAGE 타입이지만 images가 없으면 이미지를 렌더링하지 않는다', () => {
    const message: ChatMessageResponse = {
      ...baseMessage,
      messageType: 'IMAGE',
      content: '텍스트만',
      images: [],
    };

    const { getByText, UNSAFE_queryAllByType } = render(<ChatMessage message={message} />);
    const { Image } = require('react-native');

    expect(UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(getByText('텍스트만')).toBeTruthy();
  });
});
