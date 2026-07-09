import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { ChatRoomHeader } from '../index';

describe('ChatRoomHeader', () => {
  const defaultProps = {
    otherUserNickname: '광산주민',
    otherUserId: 42,
    lastMessageDate: '7월 8일 오후 03:00',
    onProfilePress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('상대방 닉네임을 렌더링한다', () => {
    const { getByText } = render(<ChatRoomHeader {...defaultProps} />);

    expect(getByText('광산주민')).toBeTruthy();
  });

  it('마지막 메시지 날짜를 렌더링한다', () => {
    const { getByText } = render(<ChatRoomHeader {...defaultProps} />);

    expect(getByText('7월 8일 오후 03:00')).toBeTruthy();
  });

  it('otherUserId가 있으면 눌렀을 때 onProfilePress가 호출된다', () => {
    const onProfilePress = jest.fn();
    const { getByText } = render(
      <ChatRoomHeader {...defaultProps} onProfilePress={onProfilePress} />
    );

    fireEvent.press(getByText('광산주민'));

    expect(onProfilePress).toHaveBeenCalledTimes(1);
  });

  it('otherUserId가 있으면 버튼이 비활성화되지 않는다', () => {
    const { UNSAFE_getByType } = render(<ChatRoomHeader {...defaultProps} />);

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(false);
  });

  it('otherUserId가 없으면 버튼이 비활성화된다', () => {
    const { UNSAFE_getByType } = render(
      <ChatRoomHeader {...defaultProps} otherUserId={undefined} />
    );

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
  });
});
