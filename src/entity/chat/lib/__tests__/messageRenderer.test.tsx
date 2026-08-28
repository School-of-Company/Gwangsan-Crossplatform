import React from 'react';
import { render } from '@testing-library/react-native';
import {
  formatMessageTime,
  getMessageDateKey,
  formatDateDividerLabel,
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

describe('getMessageDateKey', () => {
  it('createdAt으로부터 연-월-일 형식의 키를 생성한다', () => {
    const createdAt = '2026-05-28T01:00:00.000Z';
    const date = new Date(createdAt);

    expect(getMessageDateKey(createdAt)).toBe(
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    );
  });
});

describe('formatDateDividerLabel', () => {
  it('오늘 날짜이면 "오늘"을 반환한다', () => {
    const today = new Date();

    expect(formatDateDividerLabel(today.toISOString())).toBe('오늘');
  });

  it('어제 날짜이면 "어제"를 반환한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    expect(formatDateDividerLabel(yesterday.toISOString())).toBe('어제');
  });

  it('오늘/어제가 아니면 전체 날짜 형식을 반환한다', () => {
    const createdAt = '2020-01-01T00:00:00.000Z';
    const date = new Date(createdAt);
    const expected = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    expect(formatDateDividerLabel(createdAt)).toBe(expected);
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

  it('Image의 onLoadStart/onLoadEnd/onError가 imageLoader 핸들러를 호출한다', () => {
    const imageLoader = createImageLoader();
    const { UNSAFE_getAllByType } = renderNode(
      renderMessageImages(imageMessage, imageLoader, config)
    );

    const { Image } = require('react-native');
    const images = UNSAFE_getAllByType(Image);

    images[0].props.onLoadStart();
    images[0].props.onLoadEnd();
    images[0].props.onError();

    expect(imageLoader.handleImageLoadStart).toHaveBeenCalledWith(1);
    expect(imageLoader.handleImageLoadEnd).toHaveBeenCalledWith(1);
    expect(imageLoader.handleImageError).toHaveBeenCalledWith(1);
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
