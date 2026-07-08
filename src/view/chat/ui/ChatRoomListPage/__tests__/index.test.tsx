import React from 'react';
import { render } from '@testing-library/react-native';
import ChatRoomListPage from '../index';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/shared/ui/Header', () => ({
  Header: ({ headerTitle, showBackButton }: { headerTitle: string; showBackButton?: boolean }) => {
    const { Text } = require('react-native');
    return <Text testID="header">{`${headerTitle}:${String(showBackButton)}`}</Text>;
  },
}));

jest.mock('@/widget/chat', () => ({
  ChatRoomList: () => {
    const { View } = require('react-native');
    return <View testID="chat-room-list" />;
  },
}));

jest.mock('@/widget/write/ui/AppFooter', () => ({
  AppFooter: () => {
    const { View } = require('react-native');
    return <View testID="footer" />;
  },
}));

describe('ChatRoomListPage', () => {
  it('헤더에 "채팅" 타이틀과 뒤로가기 버튼 숨김을 전달한다', () => {
    const { getByTestId } = render(<ChatRoomListPage />);

    expect(getByTestId('header').props.children).toBe('채팅:false');
  });

  it('ChatRoomList를 렌더링한다', () => {
    const { getByTestId } = render(<ChatRoomListPage />);

    expect(getByTestId('chat-room-list')).toBeTruthy();
  });

  it('Footer를 렌더링한다', () => {
    const { getByTestId } = render(<ChatRoomListPage />);

    expect(getByTestId('footer')).toBeTruthy();
  });
});
