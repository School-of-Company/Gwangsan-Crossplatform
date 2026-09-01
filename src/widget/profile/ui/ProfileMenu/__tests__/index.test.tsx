import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ProfileMenu from '../index';
import { useSignout, useWithdrawal } from '~/entity/auth';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/entity/auth', () => ({
  useSignout: jest.fn(),
  useWithdrawal: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.28' } },
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => {
  const { Text } = require('react-native');
  return ({ name }: { name: string }) => <Text testID="chevron-icon">{name}</Text>;
});

jest.mock('~/shared/ui/AlertModal', () => ({
  AlertModal: ({ isVisible, message, confirmText, cancelText, onCancel, onConfirm }: any) => {
    if (!isVisible) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text>{cancelText ?? '취소'}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="alert-confirm-button" onPress={onConfirm}>
          <Text>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseSignout = useSignout as jest.Mock;
const mockUseWithdrawal = useWithdrawal as jest.Mock;

const push = jest.fn();
const signout = jest.fn();
const withdrawal = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push });
  mockUseSignout.mockReturnValue({ signout, isLoading: false });
  mockUseWithdrawal.mockReturnValue({ withdrawal, isLoading: false });
});

describe('ProfileMenu', () => {
  it('본인 프로필이면 회원탈퇴/로그아웃 행을 표시한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(getByText('회원탈퇴')).toBeTruthy();
    expect(getByText('로그아웃')).toBeTruthy();
  });

  it('상대방 프로필이면 회원탈퇴/로그아웃 행은 없다', () => {
    const { queryByText } = render(<ProfileMenu isMe={false} memberId={5} />);

    expect(queryByText('회원탈퇴')).toBeNull();
    expect(queryByText('로그아웃')).toBeNull();
  });

  it('판매관리/구매내역/후기 행 각각에 chevron 아이콘을 표시한다', () => {
    const { getAllByTestId } = render(<ProfileMenu isMe memberId={1} />);

    expect(getAllByTestId('chevron-icon')).toHaveLength(3);
  });

  it('본인 프로필에서 "판매관리"를 누르면 id 없이 selling 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('판매관리'));

    expect(push).toHaveBeenCalledWith('/profile/selling');
  });

  it('상대방 프로필에서 "판매관리"를 누르면 id와 함께 selling 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} />);

    fireEvent.press(getByText('판매관리'));

    expect(push).toHaveBeenCalledWith('/profile/selling?id=5');
  });

  it('본인 프로필에서 "구매내역"을 누르면 id 없이 purchased 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('구매내역'));

    expect(push).toHaveBeenCalledWith('/profile/purchased');
  });

  it('상대방 프로필에서 "구매내역"을 누르면 id와 함께 purchased 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} />);

    fireEvent.press(getByText('구매내역'));

    expect(push).toHaveBeenCalledWith('/profile/purchased?id=5');
  });

  it('"후기"를 누르면 해당 회원의 리뷰 페이지로 이동한다', () => {
    const { getByText } = render(<ProfileMenu isMe={false} memberId={5} />);

    fireEvent.press(getByText('후기'));

    expect(push).toHaveBeenCalledWith('/reviews/5');
  });

  it('memberId가 없으면 "후기"를 눌러도 이동하지 않는다', () => {
    const { getByText } = render(<ProfileMenu isMe />);

    fireEvent.press(getByText('후기'));

    expect(push).not.toHaveBeenCalled();
  });

  it('memberId가 없을 때 후기 행의 onPress를 직접 호출해도 push하지 않는다', () => {
    const { UNSAFE_getAllByType } = render(<ProfileMenu isMe />);

    // 행 순서: 판매관리(0), 구매내역(1), 후기(2)
    const reviewRow = UNSAFE_getAllByType(TouchableOpacity)[2];
    reviewRow.props.onPress();

    expect(push).not.toHaveBeenCalled();
  });

  it('로그아웃을 누르면 확인 Alert를 띄우고, 확인 시 signout을 호출한다', () => {
    const { getByText, getByTestId, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(queryByText('정말로\n로그아웃 하시겠어요?')).toBeNull();

    fireEvent.press(getByText('로그아웃'));

    expect(getByText('정말로\n로그아웃 하시겠어요?')).toBeTruthy();

    fireEvent.press(getByTestId('alert-confirm-button'));

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('로그아웃 Alert에서 취소를 누르면 signout을 호출하지 않고 닫힌다', () => {
    const { getByText, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('로그아웃'));
    fireEvent.press(getByText('취소'));

    expect(signout).not.toHaveBeenCalled();
    expect(queryByText('정말로\n로그아웃 하시겠어요?')).toBeNull();
  });

  it('회원탈퇴를 누르면 확인 Alert를 띄우고, 확인 시 withdrawal을 호출한다', () => {
    const { getByText, getByTestId, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(queryByText('정말로 탈퇴하시겠어요?\n탈퇴 시 모든 데이터가 삭제됩니다.')).toBeNull();

    fireEvent.press(getByText('회원탈퇴'));

    expect(getByText('정말로 탈퇴하시겠어요?\n탈퇴 시 모든 데이터가 삭제됩니다.')).toBeTruthy();

    fireEvent.press(getByTestId('alert-confirm-button'));

    expect(withdrawal).toHaveBeenCalledTimes(1);
  });

  it('회원탈퇴 Alert에서 취소를 누르면 withdrawal을 호출하지 않고 닫힌다', () => {
    const { getByText, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('회원탈퇴'));
    fireEvent.press(getByText('취소'));

    expect(withdrawal).not.toHaveBeenCalled();
    expect(queryByText('정말로 탈퇴하시겠어요?\n탈퇴 시 모든 데이터가 삭제됩니다.')).toBeNull();
  });

  it('회원탈퇴 진행 중이면 "회원탈퇴 중..." 텍스트를 표시하고 로그아웃 버튼도 비활성화한다', () => {
    mockUseWithdrawal.mockReturnValue({ withdrawal, isLoading: true });

    const { getByText, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(getByText('회원탈퇴 중...')).toBeTruthy();

    fireEvent.press(getByText('로그아웃'));

    expect(queryByText('정말로\n로그아웃 하시겠어요?')).toBeNull();
  });

  it('앱 버전을 표시한다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    expect(getByText('버전')).toBeTruthy();
    expect(getByText('1.0.28')).toBeTruthy();
  });

  it('행을 누르고 있다가 떼면 pressIn/pressOut 애니메이션 핸들러가 오류 없이 실행된다', () => {
    const { getByText } = render(<ProfileMenu isMe memberId={1} />);

    const row = getByText('회원탈퇴').parent?.parent;
    if (!row) throw new Error('row not found');

    expect(() => {
      fireEvent(row, 'pressIn');
      fireEvent(row, 'pressOut');
    }).not.toThrow();
  });

  it('로그아웃 진행 중이면 "로그아웃 중..." 텍스트를 표시하고 비활성화한다', () => {
    mockUseSignout.mockReturnValue({ signout, isLoading: true });

    const { getByText, queryByText } = render(<ProfileMenu isMe memberId={1} />);

    fireEvent.press(getByText('로그아웃 중...'));

    expect(queryByText('정말로\n로그아웃 하시겠어요?')).toBeNull();
  });
});
