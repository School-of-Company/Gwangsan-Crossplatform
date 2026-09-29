import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { MessageActionOverlay, getFocusedBubbleTop, getSheetHeight } from '../index';

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: (props: any) => <View testID="message-action-blur" {...props} /> };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => () => null);

const anchor = { x: 150, y: 300, width: 200, height: 48 };

const renderOverlay = (props: Partial<React.ComponentProps<typeof MessageActionOverlay>> = {}) => {
  const handlers = { onEdit: jest.fn(), onDelete: jest.fn(), onClose: jest.fn() };
  const utils = render(
    <MessageActionOverlay visible anchor={anchor} canEdit {...handlers} {...props}>
      <Text>내 메시지</Text>
    </MessageActionOverlay>
  );
  return { ...utils, ...handlers };
};

describe('MessageActionOverlay', () => {
  it('배경을 강하게 블러 처리하고 누른 말풍선을 강조해서 보여준다', () => {
    const { getByTestId, getByText } = renderOverlay();

    expect(getByTestId('message-action-blur').props.intensity).toBe(80);
    expect(getByTestId('message-action-blur').props.tint).toBe('dark');
    expect(getByText('내 메시지')).toBeTruthy();
  });

  it('텍스트 메시지는 수정·삭제·취소를 보여준다', () => {
    const { getByText } = renderOverlay();

    expect(getByText('수정')).toBeTruthy();
    expect(getByText('삭제')).toBeTruthy();
    expect(getByText('취소')).toBeTruthy();
  });

  it('수정할 수 없는 메시지(이미지)는 수정을 빼고 보여준다', () => {
    const { queryByText, getByText } = renderOverlay({ canEdit: false });

    expect(queryByText('수정')).toBeNull();
    expect(getByText('삭제')).toBeTruthy();
  });

  it('각 메뉴를 누르면 해당 동작을 부른다', () => {
    const { getByTestId, onEdit, onDelete, onClose } = renderOverlay();

    fireEvent.press(getByTestId('message-action-edit'));
    fireEvent.press(getByTestId('message-action-delete'));
    fireEvent.press(getByTestId('message-action-cancel'));

    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('배경을 누르면 닫힌다', () => {
    const { getByTestId, onClose } = renderOverlay();

    fireEvent.press(getByTestId('message-action-backdrop'));

    expect(onClose).toHaveBeenCalled();
  });

  it('닫혀 있으면 아무것도 그리지 않는다', () => {
    const { queryByText } = renderOverlay({ visible: false });

    expect(queryByText('삭제')).toBeNull();
  });
});

describe('getFocusedBubbleTop', () => {
  const screenHeight = 800;
  const sheetHeight = getSheetHeight(2, 34);

  it('메뉴에 가려지지 않으면 원래 자리에 그대로 둔다', () => {
    expect(
      getFocusedBubbleTop({ x: 0, y: 200, width: 100, height: 48 }, screenHeight, sheetHeight, 55)
    ).toBe(200);
  });

  it('메뉴에 가려지면 메뉴 바로 위로 올린다', () => {
    const top = getFocusedBubbleTop(
      { x: 0, y: 700, width: 100, height: 48 },
      screenHeight,
      sheetHeight,
      55
    );

    expect(top + 48).toBeLessThanOrEqual(screenHeight - sheetHeight);
  });

  it('말풍선이 매우 길어도 화면 위쪽 안전 영역 밖으로 나가지 않는다', () => {
    expect(
      getFocusedBubbleTop({ x: 0, y: 100, width: 100, height: 900 }, screenHeight, sheetHeight, 55)
    ).toBe(55);
  });
});
