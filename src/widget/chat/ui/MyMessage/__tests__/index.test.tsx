import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, ActivityIndicator } from 'react-native';
import { MyMessage } from '../index';
import { renderMessageContent } from '@/entity/chat';
import { useChatQueueStore, MESSAGE_STATUS } from '~/shared/store/useChatQueueStore';
import type { EnhancedChatMessage } from '~/entity/chat/model/useChatMessages';

jest.mock('@expo/vector-icons/Ionicons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return function MockIcon(props: any) {
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
});

jest.mock('@/entity/chat', () => ({
  useImageLoader: jest.fn(() => ({})),
  formatMessageTime: jest.fn(() => '오후 3:00'),
  renderMessageContent: jest.fn(),
}));

jest.mock('~/shared/store/useChatQueueStore', () => ({
  useChatQueueStore: jest.fn(),
  MESSAGE_STATUS: {
    PENDING: 'pending',
    SENDING: 'sending',
    SENT: 'sent',
    FAILED: 'failed',
  },
}));

const mockRenderMessageContent = renderMessageContent as jest.Mock;
const mockUseChatQueueStore = useChatQueueStore as unknown as jest.Mock;

const makeMessage = (overrides: Partial<EnhancedChatMessage> = {}): EnhancedChatMessage =>
  ({
    messageId: 1,
    roomId: 1,
    content: '안녕하세요',
    messageType: 'TEXT',
    createdAt: '2026-07-08T06:00:00.000Z',
    images: [],
    senderNickname: '나',
    senderId: 1,
    checked: false,
    isMine: true,
    status: MESSAGE_STATUS.SENT,
    ...overrides,
  }) as EnhancedChatMessage;

let mockRetry: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockRetry = jest.fn();
  mockUseChatQueueStore.mockImplementation((selector: any) => selector({ retry: mockRetry }));
  mockRenderMessageContent.mockReturnValue(<Text>안녕하세요</Text>);
});

describe('MyMessage', () => {
  it('content가 없으면 아무것도 렌더링하지 않는다', () => {
    mockRenderMessageContent.mockReturnValue(null);

    const { toJSON } = render(<MyMessage message={makeMessage()} />);

    expect(toJSON()).toBeNull();
  });

  it('메시지 내용을 렌더링한다', () => {
    const { getByText } = render(<MyMessage message={makeMessage()} />);

    expect(getByText('안녕하세요')).toBeTruthy();
  });

  it('포맷된 시간을 렌더링한다', () => {
    const { getByText } = render(<MyMessage message={makeMessage()} />);

    expect(getByText('오후 3:00')).toBeTruthy();
  });

  it('status가 PENDING이면 시계 아이콘을 표시한다', () => {
    const { getByTestId } = render(
      <MyMessage message={makeMessage({ status: MESSAGE_STATUS.PENDING })} />
    );

    expect(getByTestId('icon-time-outline')).toBeTruthy();
  });

  it('status가 SENDING이면 ActivityIndicator를 표시한다', () => {
    const { UNSAFE_getByType } = render(
      <MyMessage message={makeMessage({ status: MESSAGE_STATUS.SENDING })} />
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('status가 FAILED이면 에러 아이콘과 재전송 버튼을 표시한다', () => {
    const { getByTestId, getByText } = render(
      <MyMessage message={makeMessage({ status: MESSAGE_STATUS.FAILED })} />
    );

    expect(getByTestId('icon-alert-circle-outline')).toBeTruthy();
    expect(getByText('재전송')).toBeTruthy();
  });

  it('status가 SENT이면 체크 아이콘을 표시하고 재전송 버튼이 없다', () => {
    const { getByTestId, queryByText } = render(
      <MyMessage message={makeMessage({ status: MESSAGE_STATUS.SENT })} />
    );

    expect(getByTestId('icon-checkmark-outline')).toBeTruthy();
    expect(queryByText('재전송')).toBeNull();
  });

  it('재전송 버튼을 누르면 tempId로 retry가 호출된다', () => {
    const { getByText } = render(
      <MyMessage
        message={makeMessage({ status: MESSAGE_STATUS.FAILED, tempId: 'temp-1' } as any)}
      />
    );

    fireEvent.press(getByText('재전송'));

    expect(mockRetry).toHaveBeenCalledWith('temp-1');
  });

  it('tempId가 없으면 재전송 버튼을 눌러도 retry가 호출되지 않는다', () => {
    const { getByText } = render(
      <MyMessage message={makeMessage({ status: MESSAGE_STATUS.FAILED })} />
    );

    fireEvent.press(getByText('재전송'));

    expect(mockRetry).not.toHaveBeenCalled();
  });
});
