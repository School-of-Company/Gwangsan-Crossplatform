import React from 'react';
import { FlatList, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ChatRoomContent } from '../index';
import { MESSAGE_TYPE } from '~/shared/types/chatType';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

jest.mock('react-native-vector-icons/Ionicons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return function MockIcon(props: any) {
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
});

jest.mock('~/widget/chat', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    MyMessage: ({ message }: any) => <Text testID={`my-message-${message.messageId}`} />,
    OtherMessage: ({ message }: any) => <Text testID={`other-message-${message.messageId}`} />,
  };
});

jest.mock('~/entity/chat', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    TradeEmbed: ({ product }: any) => <Text testID={`trade-embed-${product.id}`} />,
  };
});

const createMessage = (overrides: Partial<EnhancedChatMessage> = {}): EnhancedChatMessage => ({
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

const createProduct = (overrides: Partial<TradeProduct> = {}): TradeProduct => ({
  id: 100,
  title: '거래 상품',
  images: [{ imageId: 1, imageUrl: 'https://example.com/product.png' }],
  createdAt: '2026-05-28T01:30:00.000Z',
  isSeller: false,
  isCompletable: true,
  isCompleted: false,
  ...overrides,
});

const defaultProps = {
  messages: [],
  hasMessages: false,
  flatListRef: React.createRef<FlatList<any>>(),
  renderHeader: () => <Text>채팅방 헤더</Text>,
  onProfilePress: jest.fn(),
  onScrollToEnd: jest.fn(),
};

describe('ChatRoomContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('메시지와 거래 임베드가 모두 없으면 빈 상태를 표시한다', () => {
    const { getByText, getByTestId, queryByText } = render(<ChatRoomContent {...defaultProps} />);

    expect(getByTestId('icon-chatbubbles-outline')).toBeTruthy();
    expect(getByText(/아직 대화가 없습니다/)).toBeTruthy();
    expect(queryByText('채팅방 헤더')).toBeNull();
  });

  it('거래 임베드를 메시지 createdAt 순서에 맞게 삽입한다', () => {
    const messages = [
      createMessage({ messageId: 1, createdAt: '2026-05-28T01:00:00.000Z' }),
      createMessage({
        messageId: 2,
        createdAt: '2026-05-28T02:00:00.000Z',
        isMine: true,
      }),
    ];
    const product = createProduct({ id: 30, createdAt: '2026-05-28T01:30:00.000Z' });

    const { UNSAFE_getByType, getByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        messages={messages}
        hasMessages
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          isLoading: false,
          requestorNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(
      list.props.data.map(
        (item: any) => `${item.type}-${item.data.messageId ?? item.data.product.id}`
      )
    ).toEqual(['message-1', 'trade-30', 'message-2']);
    expect(getByTestId('other-message-1')).toBeTruthy();
    expect(getByTestId('trade-embed-30')).toBeTruthy();
    expect(getByTestId('my-message-2')).toBeTruthy();
  });

  it('거래 임베드만 있어도 목록을 렌더링한다', () => {
    const product = createProduct({ id: 50 });

    const { UNSAFE_getByType, getByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: false,
          isLoading: false,
          requestorNickname: '상대방',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data).toHaveLength(1);
    expect(list.props.data[0].type).toBe('trade');
    expect(getByTestId('trade-embed-50')).toBeTruthy();
  });

  it('메시지와 거래 임베드에 안정적인 key를 사용한다', () => {
    const message = createMessage({ messageId: 7 });
    const product = createProduct({ id: 8 });

    const { UNSAFE_getByType } = render(
      <ChatRoomContent
        {...defaultProps}
        messages={[message]}
        hasMessages
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: false,
          isLoading: false,
          requestorNickname: '상대방',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.keyExtractor(list.props.data[0])).toBe('m-7');
    expect(list.props.keyExtractor(list.props.data[1])).toBe('t-8');
  });
});
