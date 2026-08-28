import React from 'react';
import { Animated, TouchableOpacity } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useChatRooms } from '~/entity/chat/model/useChatRooms';
import { useFooterVisibilityStore } from '~/shared/store/useFooterVisibilityStore';
import { Footer } from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/entity/chat/model/useChatRooms', () => ({
  useChatRooms: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseChatRooms = useChatRooms as jest.Mock;

const mockPush = jest.fn();
const mockNavigate = jest.fn();

const TAB_ROUTE_NAMES = ['main', 'chatting', 'notice', 'profile'];

function createProps(activeRouteName: string, overrides: Record<string, unknown> = {}) {
  const index = TAB_ROUTE_NAMES.indexOf(activeRouteName);
  return {
    state: {
      index,
      routes: TAB_ROUTE_NAMES.map((name) => ({ key: name, name })),
    },
    navigation: { navigate: mockNavigate },
    descriptors: {},
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    ...overrides,
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  useFooterVisibilityStore.getState().reset();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseChatRooms.mockReturnValue({ totalUnreadCount: 0 });
});

describe('Footer', () => {
  it('네비게이션 라벨을 모두 렌더링한다', () => {
    const { getByText } = render(<Footer {...createProps('chatting')} />);
    expect(getByText('홈')).toBeTruthy();
    expect(getByText('채팅')).toBeTruthy();
    expect(getByText('공지')).toBeTruthy();
    expect(getByText('프로필')).toBeTruthy();
  });

  it('현재 탭이 아니면 홈 클릭 시 navigation.navigate("main")을 호출한다', () => {
    const { getByText } = render(<Footer {...createProps('chatting')} />);
    fireEvent.press(getByText('홈'));
    expect(mockNavigate).toHaveBeenCalledWith('main');
  });

  it('이미 홈 탭이면 홈 클릭 시 navigate를 호출하지 않는다', () => {
    const { getByText } = render(<Footer {...createProps('main')} />);
    fireEvent.press(getByText('홈'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('채팅 클릭 시 navigation.navigate("chatting")을 호출한다', () => {
    const { getByText } = render(<Footer {...createProps('main')} />);
    fireEvent.press(getByText('채팅'));
    expect(mockNavigate).toHaveBeenCalledWith('chatting');
  });

  it('공지 클릭 시 navigation.navigate("notice")을 호출한다', () => {
    const { getByText } = render(<Footer {...createProps('main')} />);
    fireEvent.press(getByText('공지'));
    expect(mockNavigate).toHaveBeenCalledWith('notice');
  });

  it('프로필 클릭 시 navigation.navigate("profile")을 호출한다', () => {
    const { getByTestId } = render(<Footer {...createProps('main')} />);
    fireEvent.press(getByTestId('Footer-profile-button'));
    expect(mockNavigate).toHaveBeenCalledWith('profile');
  });

  it('onWritePress가 없으면 글쓰기 버튼 클릭 시 router.push("/write")를 호출한다', () => {
    const { UNSAFE_getAllByType } = render(<Footer {...createProps('main')} />);
    const writeButton = UNSAFE_getAllByType(TouchableOpacity)[2];
    fireEvent.press(writeButton);
    expect(mockPush).toHaveBeenCalledWith('/write');
  });

  it('onWritePress가 있으면 글쓰기 버튼 클릭 시 onWritePress를 호출한다', () => {
    const onWritePress = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <Footer {...createProps('main')} onWritePress={onWritePress} />
    );
    const writeButton = UNSAFE_getAllByType(TouchableOpacity)[2];
    fireEvent.press(writeButton);
    expect(onWritePress).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('읽지 않은 채팅이 있으면 배지를 렌더링한다', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 3 });
    const { UNSAFE_getByProps } = render(<Footer {...createProps('main')} />);
    expect(
      UNSAFE_getByProps({
        className: 'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500',
      })
    ).toBeTruthy();
  });

  it('읽지 않은 채팅이 없으면 배지를 렌더링하지 않는다', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 0 });
    const { UNSAFE_queryAllByProps } = render(<Footer {...createProps('main')} />);
    expect(
      UNSAFE_queryAllByProps({
        className: 'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500',
      })
    ).toHaveLength(0);
  });

  it('useFooterVisibilityStore가 숨김 상태이면 pointerEvents를 none으로 설정한다', () => {
    useFooterVisibilityStore.getState().hide();
    const { toJSON } = render(<Footer {...createProps('main')} />);
    expect((toJSON() as any).props.pointerEvents).toBe('none');
  });

  it('useFooterVisibilityStore가 보임 상태이면 pointerEvents를 auto로 설정한다', () => {
    const { toJSON } = render(<Footer {...createProps('main')} />);
    expect((toJSON() as any).props.pointerEvents).toBe('auto');
  });

  it('스냅샷 - 기본 상태', () => {
    const { toJSON } = render(<Footer {...createProps('main')} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 읽지 않은 채팅 있음', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 5 });
    const { toJSON } = render(<Footer {...createProps('main')} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('state가 아직 초기화되지 않아도(undefined) 에러 없이 렌더링한다', () => {
    const { getByText } = render(<Footer {...createProps('main', { state: undefined })} />);
    expect(getByText('홈')).toBeTruthy();
  });

  it('state.routes가 비어 있어도 에러 없이 렌더링한다', () => {
    const { getByText } = render(
      <Footer {...createProps('main', { state: { index: 0, routes: undefined } })} />
    );
    expect(getByText('홈')).toBeTruthy();
  });

  it('마운트 이후 숨김으로 전환되면 pointerEvents가 none으로 바뀐다', () => {
    const { toJSON } = render(<Footer {...createProps('main')} />);

    act(() => {
      useFooterVisibilityStore.getState().hide();
    });

    expect((toJSON() as any).props.pointerEvents).toBe('none');
  });

  it('마운트 이후 다시 보임으로 전환되면 pointerEvents가 auto로 복귀한다', () => {
    useFooterVisibilityStore.getState().hide();
    const { toJSON } = render(<Footer {...createProps('main')} />);

    act(() => {
      useFooterVisibilityStore.getState().show();
    });

    expect((toJSON() as any).props.pointerEvents).toBe('auto');
  });

  it('레이아웃 측정 후 footerHeight가 반영되어도 에러 없이 렌더링된다', () => {
    const { UNSAFE_getAllByType } = render(<Footer {...createProps('main')} />);
    const animatedViews = UNSAFE_getAllByType(Animated.View);
    const innerView = animatedViews.find((node) => typeof node.props.onLayout === 'function');

    act(() => {
      innerView?.props.onLayout({ nativeEvent: { layout: { height: 90 } } });
    });

    expect(innerView?.props.onLayout).toBeInstanceOf(Function);
  });
});
