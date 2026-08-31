import React from 'react';
import { DeviceEventEmitter, FlatList, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ChatRoomContent } from '../index';
import { MESSAGE_TYPE } from '~/shared/types/chatType';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('@expo/vector-icons/Ionicons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return function MockIcon(props: any) {
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
});

jest.mock('../../MyMessage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    MyMessage: ({ message, isLast }: any) => (
      <Text testID={`my-message-${message.messageId}`}>{isLast ? 'last' : ''}</Text>
    ),
  };
});

jest.mock('../../OtherMessage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    OtherMessage: ({ message }: any) => <Text testID={`other-message-${message.messageId}`} />,
  };
});

jest.mock('../../ChatDateDivider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    ChatDateDivider: ({ label }: any) => <Text testID="date-divider">{label}</Text>,
  };
});

jest.mock('~/entity/chat', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    TradeEmbed: ({ product }: any) => <Text testID={`trade-embed-${product.id}`} />,
    TradeReservedEmbed: ({ scheduledAt, placeName }: any) => (
      <Text testID="trade-reserved-embed">{`${scheduledAt ?? ''}-${placeName ?? ''}`}</Text>
    ),
    TradeCompletedEmbed: ({ onReviewButtonPress }: any) => (
      <Text testID="trade-completed-embed" onPress={onReviewButtonPress}>
        리뷰 작성하기
      </Text>
    ),
    formatMessageTime: (createdAt: string) => createdAt,
    getMessageDateKey: (createdAt: string) => createdAt.slice(0, 10),
    formatDateDividerLabel: (createdAt: string) => `날짜-${createdAt.slice(0, 10)}`,
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
  isReserved: false,
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
          otherPartyNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(
      list.props.data.map(
        (item: any) =>
          `${item.type}-${item.data.messageId ?? item.data.product?.id ?? item.data.label}`
      )
    ).toEqual(['dateDivider-날짜-2026-05-28', 'message-1', 'trade-30', 'message-2']);
    expect(getByTestId('other-message-1')).toBeTruthy();
    expect(getByTestId('trade-embed-30')).toBeTruthy();
    expect(getByTestId('my-message-2')).toBeTruthy();
  });

  it('WS(UTC)와 REST(로컬, 오프셋 없음) 타임스탬프가 섞여도 epoch 기준으로 정렬한다', () => {
    // REST는 오프셋 없는 로컬(KST) 시간 문자열, WS는 UTC(Z) 문자열이라 raw string 비교로는
    // 나중에 도착한 WS 메시지("02...Z")가 REST 거래 카드("11...")보다 사전식으로 앞선 것처럼
    // 잘못 판정되어 거래 카드가 findIndex(-1)로 맨 끝에 밀려난다. epoch 비교여야 정상 위치로 삽입된다.
    // TZ는 jest.config.js에서 Asia/Seoul로 고정된다.
    const messages = [
      createMessage({ messageId: 1, createdAt: '2026-08-30T10:00:00.000000' }), // REST, KST 10:00 (UTC 01:00)
      createMessage({
        messageId: 2,
        createdAt: '2026-08-30T02:23:50.000Z', // WS, UTC 02:23:50 (거래보다 5초 뒤)
        isMine: true,
      }),
    ];
    const product = createProduct({ id: 30, createdAt: '2026-08-30T11:23:45.000000' }); // REST, KST 11:23:45 (UTC 02:23:45)

    const { UNSAFE_getByType } = render(
      <ChatRoomContent
        {...defaultProps}
        messages={messages}
        hasMessages
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          otherPartyNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(
      list.props.data.map(
        (item: any) =>
          `${item.type}-${item.data.messageId ?? item.data.product?.id ?? item.data.label}`
      )
    ).toEqual(['dateDivider-날짜-2026-08-30', 'message-1', 'trade-30', 'message-2']);
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
          otherPartyNickname: '상대방',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data).toHaveLength(2);
    expect(list.props.data[0].type).toBe('dateDivider');
    expect(list.props.data[1].type).toBe('trade');
    expect(getByTestId('trade-embed-50')).toBeTruthy();
  });

  it('거래가 완료되면 기존 거래 카드는 그 자리에 그대로 두고, 완료+리뷰 카드는 대화 맨 끝에 새로 추가한다', () => {
    const onReviewButtonPress = jest.fn();
    const messages = [
      createMessage({ messageId: 1, createdAt: '2026-05-28T01:00:00.000Z' }),
      createMessage({ messageId: 2, createdAt: '2026-05-28T03:00:00.000Z', isMine: true }),
    ];
    // 거래 카드(01:30)보다 늦은 메시지(03:00)가 이미 있어도, 완료 카드는 그 사이에 끼어들지 않고
    // 맨 끝에 붙어야 한다 — 서버가 완료 시점을 안 주므로 "지금이 가장 최근"이라고 가정한다
    const product = createProduct({
      id: 60,
      createdAt: '2026-05-28T01:30:00.000Z',
      isCompleted: true,
    });

    const { UNSAFE_getByType, getByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        messages={messages}
        hasMessages
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          otherPartyNickname: '요청자',
        }}
        showReviewButton
        onReviewButtonPress={onReviewButtonPress}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data.map((item: any) => item.type)).toEqual([
      'dateDivider',
      'message',
      'trade',
      'message',
      'tradeCompleted',
    ]);
    expect(getByTestId('trade-embed-60')).toBeTruthy();

    fireEvent.press(getByTestId('trade-completed-embed'));
    expect(onReviewButtonPress).toHaveBeenCalledTimes(1);
  });

  it('예약이 되면 기존 거래 카드는 그 자리에 그대로 두고, 예약 카드는 대화 맨 끝에 새로 추가한다', () => {
    const messages = [
      createMessage({ messageId: 1, createdAt: '2026-05-28T01:00:00.000Z' }),
      createMessage({ messageId: 2, createdAt: '2026-05-28T03:00:00.000Z', isMine: true }),
    ];
    const product = createProduct({
      id: 65,
      createdAt: '2026-05-28T01:30:00.000Z',
      isReserved: true,
      reservationScheduledAt: '2026-08-28T14:00:00',
      reservationPlaceName: '상무역 2번 출구',
    });

    const { UNSAFE_getByType, getByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        messages={messages}
        hasMessages
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          otherPartyNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data.map((item: any) => item.type)).toEqual([
      'dateDivider',
      'message',
      'trade',
      'message',
      'tradeReserved',
    ]);
    expect(getByTestId('trade-embed-65')).toBeTruthy();
    expect(getByTestId('trade-reserved-embed').props.children).toBe(
      '2026-08-28T14:00:00-상무역 2번 출구'
    );
  });

  it('거래가 완료되면 예약 카드 대신 완료 카드를 대화 맨 끝에 추가한다', () => {
    const product = createProduct({
      id: 66,
      isReserved: true,
      isCompleted: true,
      reservationScheduledAt: '2026-08-28T14:00:00',
      reservationPlaceName: '상무역 2번 출구',
    });

    const { UNSAFE_getByType, queryByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          otherPartyNickname: '요청자',
        }}
        showReviewButton
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data.map((item: any) => item.type)).toEqual([
      'dateDivider',
      'trade',
      'tradeCompleted',
    ]);
    expect(queryByTestId('trade-reserved-embed')).toBeNull();
  });

  it('거래완료로 isCompletable이 false가 되어 showButtons가 바뀌어도, 기존 카드의 방향/문구는 isSeller 기준으로 고정된다', () => {
    // shouldShowButtons(=showButtons)는 isCompletable에서 파생되어 거래완료 시 항상 false가 되지만,
    // 카드가 반대편으로 뒤집히면 안 되므로 isSeller를 기준으로 고정해야 한다
    const product = createProduct({ id: 70, isSeller: true, isCompleted: true });

    const { UNSAFE_getByType } = render(
      <ChatRoomContent
        {...defaultProps}
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: false,
          otherPartyNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);
    const tradeItem = list.props.data.find((item: any) => item.type === 'trade');

    expect(tradeItem.data.showButtons).toBe(true);
  });

  it('showReviewButton이 false면 거래가 완료되어도 리뷰용 완료 카드를 추가하지 않는다', () => {
    const product = createProduct({ id: 61, isCompleted: true });

    const { UNSAFE_getByType, queryByTestId } = render(
      <ChatRoomContent
        {...defaultProps}
        tradeEmbedConfig={{
          shouldShow: true,
          product,
          showButtons: true,
          otherPartyNickname: '요청자',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.data.map((item: any) => item.type)).toEqual(['dateDivider', 'trade']);
    expect(queryByTestId('trade-completed-embed')).toBeNull();
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
          otherPartyNickname: '상대방',
        }}
      />
    );

    const list = UNSAFE_getByType(FlatList);

    expect(list.props.keyExtractor(list.props.data[0])).toBe(`d-${message.createdAt}`);
    expect(list.props.keyExtractor(list.props.data[1])).toBe('m-7');
    expect(list.props.keyExtractor(list.props.data[2])).toBe('t-8');
  });

  it('내가 보낸 마지막 메시지에만 isLast를 전달한다', () => {
    const messages = [
      createMessage({ messageId: 1, isMine: true }),
      createMessage({ messageId: 2, isMine: false }),
      createMessage({ messageId: 3, isMine: true }),
      createMessage({ messageId: 4, isMine: true }),
    ];

    const { getByTestId } = render(
      <ChatRoomContent {...defaultProps} messages={messages} hasMessages />
    );

    expect(getByTestId('my-message-1').props.children).toBe('');
    expect(getByTestId('my-message-3').props.children).toBe('');
    expect(getByTestId('my-message-4').props.children).toBe('last');
  });

  it('키보드가 나타나고 사라짐에 따라 리스트 하단 여백을 조정한다', () => {
    const { UNSAFE_getByType } = render(
      <ChatRoomContent {...defaultProps} messages={[createMessage()]} hasMessages />
    );

    const list = UNSAFE_getByType(FlatList);
    expect(list.props.contentContainerStyle.paddingBottom).toBe(10);

    act(() => {
      DeviceEventEmitter.emit('keyboardWillShow', { endCoordinates: { height: 300 } });
    });

    const listAfterShow = UNSAFE_getByType(FlatList);
    expect(listAfterShow.props.contentContainerStyle.paddingBottom).toBe(310);

    act(() => {
      DeviceEventEmitter.emit('keyboardWillHide');
    });

    const listAfterHide = UNSAFE_getByType(FlatList);
    expect(listAfterHide.props.contentContainerStyle.paddingBottom).toBe(10);
  });
});
