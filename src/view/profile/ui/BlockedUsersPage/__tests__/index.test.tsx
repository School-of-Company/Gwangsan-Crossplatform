import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import BlockedUsersPageView from '../index';
import { useGetBlockList } from '~/view/profile/model/useGetBlockList';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/view/profile/model/useGetBlockList', () => ({ useGetBlockList: jest.fn() }));
jest.mock('~/entity/profile/model/useBlockUser', () => ({ useBlockUser: jest.fn() }));

jest.mock('~/shared/ui', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return {
    Header: ({ headerTitle, showBackButton }: any) => (
      <Text testID="header">{JSON.stringify({ headerTitle, showBackButton })}</Text>
    ),
    AlertModal: ({
      isVisible,
      message,
      cancelText = '취소',
      confirmText,
      onCancel,
      onConfirm,
    }: any) =>
      isVisible ? (
        <View>
          <Text>{message}</Text>
          {onCancel && (
            <TouchableOpacity testID="alert-cancel" onPress={onCancel}>
              <Text>{cancelText}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity testID="alert-confirm" onPress={onConfirm}>
            <Text>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      ) : null,
  };
});

const mockUseGetBlockList = useGetBlockList as jest.Mock;
const mockUseBlockUser = useBlockUser as jest.Mock;

const unblockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseBlockUser.mockReturnValue({
    block: { mutate: jest.fn(), isPending: false },
    unblock: { mutate: unblockMutate, isPending: false },
  });
});

describe('BlockedUsersPageView', () => {
  it('헤더에 "차단 목록" 타이틀을 표시한다', () => {
    mockUseGetBlockList.mockReturnValue({ data: [], isLoading: false, isError: false });

    const { getByTestId } = render(<BlockedUsersPageView />);

    expect(getByTestId('header')).toHaveTextContent(
      JSON.stringify({ headerTitle: '차단 목록', showBackButton: true })
    );
  });

  it('차단한 사용자가 없으면 안내 문구를 표시한다', () => {
    mockUseGetBlockList.mockReturnValue({ data: [], isLoading: false, isError: false });

    const { getByText } = render(<BlockedUsersPageView />);

    expect(getByText('차단한 사용자가 없습니다.')).toBeTruthy();
  });

  it('차단한 사용자 목록을 표시한다', () => {
    mockUseGetBlockList.mockReturnValue({
      data: [
        { memberId: 1, nickname: '차단유저1' },
        { memberId: 2, nickname: '차단유저2' },
      ],
      isLoading: false,
      isError: false,
    });

    const { getByText } = render(<BlockedUsersPageView />);

    expect(getByText('차단유저1')).toBeTruthy();
    expect(getByText('차단유저2')).toBeTruthy();
  });

  it('"차단 해제"를 누르면 확인 AlertModal을 띄우고, 확인 시 unblock을 호출한다', () => {
    mockUseGetBlockList.mockReturnValue({
      data: [{ memberId: 1, nickname: '차단유저1' }],
      isLoading: false,
      isError: false,
    });

    const { getByText, getByTestId } = render(<BlockedUsersPageView />);

    fireEvent.press(getByText('차단 해제'));

    expect(getByText('차단유저1님을 차단 해제하시겠습니까?')).toBeTruthy();
    expect(mockUseBlockUser).toHaveBeenCalledWith(1);

    fireEvent.press(getByTestId('alert-confirm'));

    expect(unblockMutate).toHaveBeenCalledTimes(1);
  });

  it('확인 AlertModal에서 취소를 누르면 unblock을 호출하지 않는다', () => {
    mockUseGetBlockList.mockReturnValue({
      data: [{ memberId: 1, nickname: '차단유저1' }],
      isLoading: false,
      isError: false,
    });

    const { getByText, getByTestId, queryByText } = render(<BlockedUsersPageView />);

    fireEvent.press(getByText('차단 해제'));
    fireEvent.press(getByTestId('alert-cancel'));

    expect(unblockMutate).not.toHaveBeenCalled();
    expect(queryByText('차단유저1님을 차단 해제하시겠습니까?')).toBeNull();
  });

  it('unblock이 진행 중이면 버튼 텍스트가 바뀌고 비활성화된다', () => {
    mockUseGetBlockList.mockReturnValue({
      data: [{ memberId: 1, nickname: '차단유저1' }],
      isLoading: false,
      isError: false,
    });
    mockUseBlockUser.mockReturnValue({
      block: { mutate: jest.fn(), isPending: false },
      unblock: { mutate: unblockMutate, isPending: true },
    });

    const { getByText } = render(<BlockedUsersPageView />);

    expect(getByText('해제 중...')).toBeTruthy();
  });

  it('목록 조회 실패 시 에러 토스트를 표시한다', async () => {
    mockUseGetBlockList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('네트워크 오류'),
    });

    render(<BlockedUsersPageView />);

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '차단 목록을 불러오는데 실패했습니다.',
          text2: '네트워크 오류',
        })
      );
    });
  });
});
