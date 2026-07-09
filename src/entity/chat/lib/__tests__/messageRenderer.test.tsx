import React from 'react';
import { render } from '@testing-library/react-native';
import {
  formatMessageTime,
  renderMessageImages,
  renderMessageText,
  renderMessageContent,
  MessageRenderConfig,
} from '../messageRenderer';
import type { ChatMessageResponse } from '../../model/chatTypes';
import type { UseImageLoaderReturn } from '../../model/useImageLoader';

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

const config: MessageRenderConfig = {
  variant: 'received',
  bgColor: 'bg-gray-100',
  textColor: 'text-gray-800',
  errorIconColor: '#ff0000',
  errorBgColor: 'bg-red-100',
  errorTextColor: 'text-red-500',
  loadingBgColor: 'bg-black',
};

const createImageLoader = (
  overrides: Partial<UseImageLoaderReturn> = {}
): UseImageLoaderReturn => ({
  imageStates: {},
  handleImageLoadStart: jest.fn(),
  handleImageLoadEnd: jest.fn(),
  handleImageError: jest.fn(),
  isImageLoading: jest.fn().mockReturnValue(false),
  hasImageError: jest.fn().mockReturnValue(false),
  ...overrides,
});

const renderNode = (node: React.ReactNode) => render(<>{node}</>);

describe('formatMessageTime', () => {
  it('createdAt을 ko-KR 시:분 형식 문자열로 변환한다', () => {
    const createdAt = '2026-05-28T01:00:00.000Z';
    const expected = new Date(createdAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    expect(formatMessageTime(createdAt)).toBe(expected);
  });
});

describe('renderMessageText', () => {
  it('TEXT 타입이고 content가 있으면 텍스트를 렌더링한다', () => {
    const { getByText } = renderNode(renderMessageText(baseMessage, config));

    expect(getByText('안녕하세요')).toBeTruthy();
  });

  it('TEXT 타입이 아니면 null을 반환한다', () => {
    const message = { ...baseMessage, messageType: 'IMAGE' as const };

    expect(renderMessageText(message, config)).toBeNull();
  });

  it('content가 없으면 null을 반환한다', () => {
    const message = { ...baseMessage, content: null };

    expect(renderMessageText(message, config)).toBeNull();
  });
});

describe('renderMessageImages', () => {
  const imageMessage: ChatMessageResponse = {
    ...baseMessage,
    messageType: 'IMAGE',
    content: '사진 설명',
    images: [
      { imageId: 1, imageUrl: 'https://example.com/1.png' },
      { imageId: 2, imageUrl: 'https://example.com/2.png' },
    ],
  };

  it('IMAGE 타입이 아니면 null을 반환한다', () => {
    expect(renderMessageImages(baseMessage, createImageLoader(), config)).toBeNull();
  });

  it('images가 없거나 비어있으면 null을 반환한다', () => {
    const message = { ...baseMessage, messageType: 'IMAGE' as const, images: [] };

    expect(renderMessageImages(message, createImageLoader(), config)).toBeNull();
  });

  it('정상 이미지는 Image로 렌더링하고 content가 있으면 텍스트도 표시한다', () => {
    const imageLoader = createImageLoader();
    const { UNSAFE_getAllByType, getByText } = renderNode(
      renderMessageImages(imageMessage, imageLoader, config)
    );

    const { Image } = require('react-native');
    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
    expect(getByText('사진 설명')).toBeTruthy();
  });

  it('에러가 발생한 이미지는 에러 플레이스홀더를 렌더링한다', () => {
    const imageLoader = createImageLoader({
      hasImageError: jest.fn((imageId: number) => imageId === 1),
    });

    const { getByText, UNSAFE_getAllByType } = renderNode(
      renderMessageImages(imageMessage, imageLoader, config)
    );

    const { Image } = require('react-native');
    expect(getByText('이미지 로드 실패')).toBeTruthy();
    expect(UNSAFE_getAllByType(Image)).toHaveLength(1);
  });

  it('로딩 중인 이미지는 로딩 인디케이터를 표시한다', () => {
    const imageLoader = createImageLoader({
      isImageLoading: jest.fn((imageId: number) => imageId === 2),
    });

    const { UNSAFE_getAllByType } = renderNode(
      renderMessageImages(imageMessage, imageLoader, config)
    );

    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator)).toHaveLength(1);
  });

  it('content가 없으면 텍스트를 렌더링하지 않는다', () => {
    const message = { ...imageMessage, content: null };
    const { queryByText } = renderNode(renderMessageImages(message, createImageLoader(), config));

    expect(queryByText('사진 설명')).toBeNull();
  });
});

describe('renderMessageContent', () => {
  it('IMAGE 타입이며 images가 있으면 renderMessageImages 결과를 반환한다', () => {
    const message: ChatMessageResponse = {
      ...baseMessage,
      messageType: 'IMAGE',
      content: null,
      images: [{ imageId: 1, imageUrl: 'https://example.com/1.png' }],
    };

    const { UNSAFE_getAllByType } = renderNode(
      renderMessageContent(message, createImageLoader(), config)
    );

    const { Image } = require('react-native');
    expect(UNSAFE_getAllByType(Image)).toHaveLength(1);
  });

  it('TEXT 타입이며 content가 있으면 renderMessageText 결과를 반환한다', () => {
    const { getByText } = renderNode(
      renderMessageContent(baseMessage, createImageLoader(), config)
    );

    expect(getByText('안녕하세요')).toBeTruthy();
  });

  it('조건에 맞지 않으면 null을 반환한다', () => {
    const message = { ...baseMessage, content: null };

    expect(renderMessageContent(message, createImageLoader(), config)).toBeNull();
  });
});
