import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { MessageActionOverlay, getMenuHeight, getMenuLayout } from '../index';

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

  it('메뉴 맨 위에 보낸 시각을 보여준다', () => {
    const { getByTestId } = renderOverlay({ timeLabel: '어제 오후 10:18' });

    expect(getByTestId('message-action-time')).toHaveTextContent('어제 오후 10:18');
  });

  it('시각이 없으면 머리글을 그리지 않는다', () => {
    const { queryByTestId } = renderOverlay();

    expect(queryByTestId('message-action-time')).toBeNull();
  });

  it('메뉴를 말풍선 오른쪽 끝에 맞춰 바로 아래에 띄운다', () => {
    const { getByTestId } = renderOverlay();
    const style = getByTestId('message-action-menu').props.style;

    expect(style.top).toBeGreaterThan(anchor.y + anchor.height);
    expect(style.transformOrigin).toBe('top right');
  });

  it('닫혀 있으면 아무것도 그리지 않는다', () => {
    const { queryByText } = renderOverlay({ visible: false });

    expect(queryByText('삭제')).toBeNull();
  });
});

describe('getMenuLayout', () => {
  const screenHeight = 800;
  const menuHeight = getMenuHeight(3, true);
  const base = { screenHeight, menuHeight, topInset: 55, bottomInset: 34 };

  it('아래 공간이 넉넉하면 말풍선은 제자리에 두고 메뉴를 바로 아래에 붙인다', () => {
    const { bubbleTop, menuTop } = getMenuLayout({
      ...base,
      anchor: { x: 0, y: 200, width: 100, height: 48 },
    });

    expect(bubbleTop).toBe(200);
    expect(menuTop).toBe(200 + 48 + 10);
  });

  it('아래 공간이 모자라면 말풍선과 메뉴를 함께 올려 화면 안에 넣는다', () => {
    const { bubbleTop, menuTop } = getMenuLayout({
      ...base,
      anchor: { x: 0, y: 650, width: 100, height: 48 },
    });

    expect(bubbleTop).toBeLessThan(650);
    expect(menuTop).toBe(bubbleTop + 48 + 10);
    expect(menuTop + menuHeight).toBeLessThanOrEqual(screenHeight - 34);
  });

  it('말풍선이 매우 길면 위쪽 안전 영역에 맞추고 메뉴는 화면 아래쪽에 겹쳐 띄운다', () => {
    const { bubbleTop, menuTop } = getMenuLayout({
      ...base,
      anchor: { x: 0, y: 100, width: 100, height: 900 },
    });

    expect(bubbleTop).toBe(55);
    expect(menuTop + menuHeight).toBeLessThanOrEqual(screenHeight - 34);
  });
});

describe('getMenuHeight', () => {
  it('머리글이 있으면 그만큼 높아진다', () => {
    expect(getMenuHeight(3, true)).toBeGreaterThan(getMenuHeight(3, false));
  });
});
