import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ProfileMenu from '../index';
import { useSignout } from '~/entity/auth';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/entity/auth', () => ({
  useSignout: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.28' } },
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text testID="chevron-icon">{name}</Text>;
});

const mockUseRouter = useRouter as jest.Mock;
const mockUseSignout = useSignout as jest.Mock;

const push = jest.fn();
const signout = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push });
  mockUseSignout.mockReturnValue({ signout, isLoading: false });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ProfileMenu', () => {
  it('본인 프로필이면 "나의 거래" 섹션과 "내 글", 로그아웃 행을 표시한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(getByText('나의 거래')).toBeTruthy();
    expect(getByText('내 글')).toBeTruthy();
    expect(getByText('로그아웃')).toBeTruthy();
  });

  it('상대방 프로필이면 "{이름}님의 거래" 섹션과 "{이름}님의 글"을 표시하고 로그아웃 행은 없다', () => {
    const { getByText, queryByText } = render(
      <ProfileMenu isMe={false} memberId={5} name="홍길동" />
    );

    expect(getByText('홍길동님의 거래')).toBeTruthy();
    expect(getByText('홍길동님의 글')).toBeTruthy();
    expect(queryByText('로그아웃')).toBeNull();
  });

  it('내 글/거래 내역/후기 행 각각에 chevron 아이콘을 표시한다', () => {
    const { getAllByTestId } = render(<ProfileMenu isMe memberId={1} />);

    expect(getAllByTestId('chevron-icon')).toHaveLength(3);
  });

  it('본인 프로필에서 "내 글"을 누르면 id 없이 posts 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('내 글'));

    expect(push).toHaveBeenCalledWith('/profile/posts');
  });

  it('본인 프로필에서 "거래 내역"을 누르면 id 없이 completedTrades 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('거래 내역'));

    expect(push).toHaveBeenCalledWith('/profile/completedTrades');
  });

  it('상대방 프로필에서 "{이름}님의 글"을 누르면 id와 함께 posts 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} name="홍길동" />);

    fireEvent.press(getByText('홍길동님의 글'));

    expect(push).toHaveBeenCalledWith('/profile/posts?id=5');
  });

  it('상대방 프로필에서 "거래 내역"을 누르면 id와 함께 completedTrades 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} name="홍길동" />);

    fireEvent.press(getByText('거래 내역'));

    expect(push).toHaveBeenCalledWith('/profile/completedTrades?id=5');
  });

  it('"후기"를 누르면 해당 회원의 리뷰 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} name="홍길동" />);

    fireEvent.press(getByText('후기'));

    expect(push).toHaveBeenCalledWith('/reviews/5');
  });

  it('memberId가 없으면 "후기"를 눌러도 이동하지 않는다', () => {
    const { getByText } = render(<ProfileMenu isMe />);

    fireEvent.press(getByText('후기'));

    expect(push).not.toHaveBeenCalled();
  });

  it('로그아웃을 누르면 확인 Alert를 띄우고, 확인 시 signout을 호출한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('로그아웃'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '로그아웃',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: '로그아웃' })])
    );

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: any) => btn.text === '로그아웃');
    confirmButton.onPress();

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('앱 버전을 표시한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(getByText('버전 1.0.28')).toBeTruthy();
  });

  it('로그아웃 진행 중이면 "로그아웃 중..." 텍스트를 표시하고 비활성화한다', () => {
    mockUseSignout.mockReturnValue({ signout, isLoading: true });

    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('로그아웃 중...'));

    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
