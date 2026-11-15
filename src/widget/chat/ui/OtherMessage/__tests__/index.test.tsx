import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { OtherMessage } from '../index';
import { renderMessageContent } from '~/entity/chat';
import type { ChatMessageResponse } from '~/entity/chat';

jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockIcon(props: any) {
    return React.createElement(View, { testID: `icon-${props.name}` });
  };
});

jest.mock('~/entity/chat', () => ({
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

  it('상대방이 수정한 메시지에도 (수정됨)을 표시한다', () => {
    const { getByText } = render(
      <OtherMessage message={makeMessage({ editedAt: '2026-07-08T07:00:00.000Z' })} />
    );

    expect(getByText('(수정됨)')).toBeTruthy();
  });

  it('시간을 숨기는 연속 메시지여도 수정 표시는 보인다', () => {
    const { getByText, queryByText } = render(
      <OtherMessage
        message={makeMessage({ editedAt: '2026-07-08T07:00:00.000Z' })}
        showTime={false}
      />
    );

    expect(getByText('(수정됨)')).toBeTruthy();
    expect(queryByText('오후 3:00')).toBeNull();
  });

  it('showProfile=false이면 닉네임과 프로필 아이콘을 렌더링하지 않는다', () => {
    const { queryByText, queryByTestId, getByText } = render(
      <OtherMessage message={makeMessage()} showProfile={false} />
    );

    expect(getByText('안녕하세요')).toBeTruthy();
    expect(queryByText('상대방')).toBeNull();
    expect(queryByTestId('icon-person')).toBeNull();
  });

  it('프로필 아이콘을 눌러도 senderId로 onProfilePress가 호출된다', () => {
    const onProfilePress = jest.fn();
    const { getByTestId } = render(
      <OtherMessage message={makeMessage({ senderId: 7 })} onProfilePress={onProfilePress} />
    );

    fireEvent.press(getByTestId('icon-person'));

    expect(onProfilePress).toHaveBeenCalledWith(7);
  });

  it('onProfilePress가 없어도 프로필을 눌렀을 때 오류가 나지 않는다', () => {
    const { getByText } = render(<OtherMessage message={makeMessage()} />);

    expect(() => fireEvent.press(getByText('상대방'))).not.toThrow();
  });

  it('showTime=false이고 수정되지 않았으면 시간 영역을 렌더링하지 않는다', () => {
    const { queryByText } = render(<OtherMessage message={makeMessage()} showTime={false} />);

    expect(queryByText('오후 3:00')).toBeNull();
    expect(queryByText('(수정됨)')).toBeNull();
  });

  it('이미지 메시지는 말풍선 배경 없이 렌더링한다', () => {
    const { toJSON } = render(
      <OtherMessage
        message={makeMessage({
          messageType: 'IMAGE',
          images: [{ imageId: 1, imageUrl: 'https://example.com/a.jpg' }],
        } as Partial<ChatMessageResponse>)}
      />
    );

    expect(JSON.stringify(toJSON())).not.toContain('rounded-3xl');
  });

  it('images가 없는 이미지 메시지도 오류 없이 말풍선으로 렌더링한다', () => {
    const { toJSON } = render(
      <OtherMessage
        message={makeMessage({
          messageType: 'IMAGE',
          images: undefined,
        } as Partial<ChatMessageResponse>)}
      />
    );

    expect(JSON.stringify(toJSON())).toContain('rounded-3xl');
  });

  it('텍스트 메시지는 말풍선 배경과 함께 렌더링한다', () => {
    const { toJSON } = render(<OtherMessage message={makeMessage()} />);

    expect(JSON.stringify(toJSON())).toContain('rounded-3xl');
  });

  it('다음 메시지와 묶이면 아래 여백을 줄인다', () => {
    const grouped = render(<OtherMessage message={makeMessage()} isFollowedByGrouped />);
    const single = render(<OtherMessage message={makeMessage()} />);

    expect(JSON.stringify(grouped.toJSON())).toContain('mb-1');
    expect(JSON.stringify(single.toJSON())).toContain('mb-4');
  });
});
