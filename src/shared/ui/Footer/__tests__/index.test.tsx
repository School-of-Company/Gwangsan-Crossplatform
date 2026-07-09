import React from 'react';
import { TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter, usePathname } from 'expo-router';
import { useChatRooms } from '~/entity/chat/model/useChatRooms';
import { Footer } from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

jest.mock('~/entity/chat/model/useChatRooms', () => ({
  useChatRooms: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseChatRooms = useChatRooms as jest.Mock;

const mockPush = jest.fn();
const mockReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush, replace: mockReplace });
  mockUsePathname.mockReturnValue('/other');
  mockUseChatRooms.mockReturnValue({ totalUnreadCount: 0 });
});

describe('Footer', () => {
  it('네비게이션 라벨을 모두 렌더링한다', () => {
    const { getByText } = render(<Footer />);
    expect(getByText('홈')).toBeTruthy();
    expect(getByText('채팅')).toBeTruthy();
    expect(getByText('공지')).toBeTruthy();
    expect(getByText('프로필')).toBeTruthy();
  });

  it('현재 경로가 아니면 홈 클릭 시 router.replace("/main")을 호출한다', () => {
    const { getByText } = render(<Footer />);
    fireEvent.press(getByText('홈'));
    expect(mockReplace).toHaveBeenCalledWith('/main');
  });

  it('이미 홈 경로이면 홈 클릭 시 router.replace를 호출하지 않는다', () => {
    mockUsePathname.mockReturnValue('/main');
    const { getByText } = render(<Footer />);
    fireEvent.press(getByText('홈'));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('채팅 클릭 시 router.replace("/chatting")을 호출한다', () => {
    const { getByText } = render(<Footer />);
    fireEvent.press(getByText('채팅'));
    expect(mockReplace).toHaveBeenCalledWith('/chatting');
  });

  it('공지 클릭 시 router.replace("/notice")을 호출한다', () => {
    const { getByText } = render(<Footer />);
    fireEvent.press(getByText('공지'));
    expect(mockReplace).toHaveBeenCalledWith('/notice');
  });

  it('프로필 클릭 시 router.replace("/profile")을 호출한다', () => {
    const { getByTestId } = render(<Footer />);
    fireEvent.press(getByTestId('Footer-profile-button'));
    expect(mockReplace).toHaveBeenCalledWith('/profile');
  });

  it('onWritePress가 없으면 글쓰기 버튼 클릭 시 router.push("/write")를 호출한다', () => {
    const { UNSAFE_getAllByType } = render(<Footer />);
    const writeButton = UNSAFE_getAllByType(TouchableOpacity)[2];
    fireEvent.press(writeButton);
    expect(mockPush).toHaveBeenCalledWith('/write');
  });

  it('onWritePress가 있으면 글쓰기 버튼 클릭 시 onWritePress를 호출한다', () => {
    const onWritePress = jest.fn();
    const { UNSAFE_getAllByType } = render(<Footer onWritePress={onWritePress} />);
    const writeButton = UNSAFE_getAllByType(TouchableOpacity)[2];
    fireEvent.press(writeButton);
    expect(onWritePress).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('읽지 않은 채팅이 있으면 배지를 렌더링한다', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 3 });
    const { UNSAFE_getByProps } = render(<Footer />);
    expect(
      UNSAFE_getByProps({
        className: 'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500',
      })
    ).toBeTruthy();
  });

  it('읽지 않은 채팅이 없으면 배지를 렌더링하지 않는다', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 0 });
    const { UNSAFE_queryAllByProps } = render(<Footer />);
    expect(
      UNSAFE_queryAllByProps({
        className: 'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-main-500',
      })
    ).toHaveLength(0);
  });

  it('스냅샷 - 기본 상태', () => {
    const { toJSON } = render(<Footer />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('스냅샷 - 읽지 않은 채팅 있음', () => {
    mockUseChatRooms.mockReturnValue({ totalUnreadCount: 5 });
    const { toJSON } = render(<Footer />);
    expect(toJSON()).toMatchSnapshot();
  });
});
