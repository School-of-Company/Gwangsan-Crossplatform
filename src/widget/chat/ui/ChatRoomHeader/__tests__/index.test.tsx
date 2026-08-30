import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ChatRoomHeader } from '../index';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';

jest.mock('~/entity/profile/model/useBlockUser', () => ({
  useBlockUser: jest.fn(),
}));

jest.mock('~/entity/post/ui', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    ReportModal: ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) =>
      isVisible ? (
        <TouchableOpacity testID="report-modal-close" onPress={onClose}>
          <Text>신고 모달 닫기</Text>
        </TouchableOpacity>
      ) : null,
  };
});

jest.mock('~/shared/ui', () => {
  const { View } = require('react-native');
  return {
    BottomSheetModalWrapper: ({
      isVisible,
      children,
    }: {
      isVisible: boolean;
      children: React.ReactNode;
    }) => (isVisible ? <View>{children}</View> : null),
  };
});

const mockUseBlockUser = useBlockUser as jest.Mock;
const mockBlockMutate = jest.fn();

describe('ChatRoomHeader', () => {
  const defaultProps = {
    otherUserNickname: '광산주민',
    otherUserId: 42,
    lastMessageDate: '7월 8일 오후 03:00',
    onProfilePress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBlockUser.mockReturnValue({ block: { mutate: mockBlockMutate, isPending: false } });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('otherUserId가 있으면 더보기 버튼이 비활성화되지 않는다', () => {
    const { getByTestId } = render(<ChatRoomHeader {...defaultProps} />);

    expect(getByTestId('ChatRoomHeader-menu-button').props.accessibilityState.disabled).toBe(false);
  });

  it('otherUserId가 없으면 더보기 버튼이 비활성화된다', () => {
    const { getByTestId } = render(<ChatRoomHeader {...defaultProps} otherUserId={undefined} />);

    expect(getByTestId('ChatRoomHeader-menu-button').props.accessibilityState.disabled).toBe(true);
  });

  describe('차단 / 신고 메뉴', () => {
    it('더보기 버튼을 누르면 메뉴가 표시된다', () => {
      const { getByTestId, getByText } = render(<ChatRoomHeader {...defaultProps} />);

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));

      expect(getByText('차단하기')).toBeTruthy();
      expect(getByText('신고하기')).toBeTruthy();
    });

    it('차단하기를 누르면 확인 Alert를 띄운다', () => {
      const { getByTestId, getByText } = render(<ChatRoomHeader {...defaultProps} />);

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));
      fireEvent.press(getByText('차단하기'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '사용자 차단',
        expect.stringContaining('광산주민'),
        expect.any(Array)
      );
    });

    it('차단 확인 Alert에서 차단을 누르면 block.mutate를 호출한다', () => {
      const { getByTestId, getByText } = render(<ChatRoomHeader {...defaultProps} />);

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));
      fireEvent.press(getByText('차단하기'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const confirmButton = buttons.find((b: { text: string }) => b.text === '차단');
      confirmButton.onPress();

      expect(mockBlockMutate).toHaveBeenCalled();
    });

    it('신고하기를 누르면 메뉴를 닫고 신고 모달을 연다', async () => {
      const { getByTestId, getByText, queryByText } = render(<ChatRoomHeader {...defaultProps} />);

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => expect(queryByText('신고하기')).toBeNull());
      expect(getByTestId('report-modal-close')).toBeTruthy();
    });

    it('신고 모달의 onClose를 호출하면 모달이 닫힌다', async () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <ChatRoomHeader {...defaultProps} />
      );

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => expect(getByTestId('report-modal-close')).toBeTruthy());

      fireEvent.press(getByTestId('report-modal-close'));

      await waitFor(() => expect(queryByTestId('report-modal-close')).toBeNull());
    });

    it('메뉴에서 취소를 누르면 메뉴가 닫힌다', () => {
      const { getByTestId, getByText, queryByText } = render(<ChatRoomHeader {...defaultProps} />);

      fireEvent.press(getByTestId('ChatRoomHeader-menu-button'));
      expect(getByText('차단하기')).toBeTruthy();

      fireEvent.press(getByText('취소'));

      expect(queryByText('차단하기')).toBeNull();
    });

    it('차단이 진행 중이면 더보기 버튼이 비활성화된다', () => {
      mockUseBlockUser.mockReturnValue({ block: { mutate: mockBlockMutate, isPending: true } });

      const { getByTestId } = render(<ChatRoomHeader {...defaultProps} />);

      expect(getByTestId('ChatRoomHeader-menu-button').props.accessibilityState.disabled).toBe(
        true
      );
    });
  });
});
