import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { OtherMessage } from '../index';
import { renderMessageContent } from '@/entity/chat';
import type { ChatMessageResponse } from '@/entity/chat';

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

const mockRenderMessageContent = renderMessageContent as jest.Mock;

const makeMessage = (overrides: Partial<ChatMessageResponse> = {}): ChatMessageResponse =>
  ({
    messageId: 1,
    roomId: 1,
    content: '안녕하세요',
    messageType: 'TEXT',
    createdAt: '2026-07-08T06:00:00.000Z',
    images: [],
    senderNickname: '상대방',
    senderId: 10,
    checked: false,
    ...overrides,
  }) as ChatMessageResponse;

beforeEach(() => {
  jest.clearAllMocks();
  mockRenderMessageContent.mockReturnValue(<Text>안녕하세요</Text>);
});

describe('OtherMessage', () => {
  it('content가 없으면 아무것도 렌더링하지 않는다', () => {
    mockRenderMessageContent.mockReturnValue(null);

    const { toJSON } = render(<OtherMessage message={makeMessage()} />);

    expect(toJSON()).toBeNull();
  });

  it('메시지 내용과 발신자 닉네임을 렌더링한다', () => {
    const { getByText } = render(<OtherMessage message={makeMessage()} />);

    expect(getByText('안녕하세요')).toBeTruthy();
    expect(getByText('상대방')).toBeTruthy();
  });

  it('포맷된 시간을 렌더링한다', () => {
    const { getByText } = render(<OtherMessage message={makeMessage()} />);

    expect(getByText('오후 3:00')).toBeTruthy();
  });

  it('onProfilePress가 있으면 프로필을 눌렀을 때 senderId로 호출된다', () => {
    const onProfilePress = jest.fn();
    const { getByText } = render(
      <OtherMessage message={makeMessage({ senderId: 99 })} onProfilePress={onProfilePress} />
    );

    fireEvent.press(getByText('상대방'));

    expect(onProfilePress).toHaveBeenCalledWith(99);
  });

  it('onProfilePress가 없으면 프로필 버튼이 비활성화된다', () => {
    const { UNSAFE_getAllByType } = render(<OtherMessage message={makeMessage()} />);

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    buttons.forEach((button) => expect(button.props.disabled).toBe(true));
  });

  it('onProfilePress가 있으면 프로필 버튼이 활성화된다', () => {
    const { UNSAFE_getAllByType } = render(
      <OtherMessage message={makeMessage()} onProfilePress={jest.fn()} />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    buttons.forEach((button) => expect(button.props.disabled).toBe(false));
  });
});
