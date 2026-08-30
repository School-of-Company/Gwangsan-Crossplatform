import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { Alert, TouchableOpacity } from 'react-native';
import { useBlockUser } from '~/entity/profile/model/useBlockUser';
import Information from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

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

const mockUseRouter = useRouter as jest.Mock;
const mockUseBlockUser = useBlockUser as jest.Mock;

const mockPush = jest.fn();
const mockBlockMutate = jest.fn();
const mockUnblockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseBlockUser.mockReturnValue({
    block: { mutate: mockBlockMutate, isPending: false },
    unblock: { mutate: mockUnblockMutate, isPending: false },
  });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Information', () => {
  describe('렌더링', () => {
    it('name을 표시한다', () => {
      const { getByTestId } = render(<Information name="홍길동" id={1} isMe={false} />);

      expect(getByTestId('Information-nickname').props.children).toBe('홍길동');
    });

    it('name이 없으면 "사용자"를 표시한다', () => {
      const { getByTestId } = render(<Information id={1} isMe={false} />);

      expect(getByTestId('Information-nickname').props.children).toBe('사용자');
    });

    it('isMe가 true이면 편집 카드를 표시한다', () => {
      const { getByTestId } = render(<Information name="홍길동" id={1} isMe />);

      expect(getByTestId('Information-edit-button')).toBeTruthy();
    });

    it('isMe가 false이면 더보기 메뉴 버튼을 표시하고 편집 카드는 표시하지 않는다', () => {
      const { queryByTestId } = render(<Information name="타인" id={2} isMe={false} />);

      expect(queryByTestId('Information-edit-button')).toBeNull();
    });
  });

  describe('내 정보 수정', () => {
    it('편집 카드를 누르면 편집 페이지로 이동한다', () => {
      const { getByTestId } = render(<Information name="홍길동" id={7} isMe />);

      fireEvent.press(getByTestId('Information-edit-button'));

      expect(mockPush).toHaveBeenCalledWith('/profile/7/edit');
    });
  });

  describe('차단 / 신고 메뉴 (isMe=false)', () => {
    it('더보기 버튼을 누르면 메뉴가 표시된다', () => {
      const { UNSAFE_getByType, getByText } = render(
        <Information name="타인" id={2} isMe={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));

      expect(getByText('차단하기')).toBeTruthy();
      expect(getByText('신고하기')).toBeTruthy();
    });

    it('isBlocked가 false이면 "차단하기"를 표시하고 누르면 차단 확인 Alert를 띄운다', () => {
      const { UNSAFE_getByType, getByText } = render(
        <Information name="타인" id={2} isMe={false} isBlocked={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('차단하기'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '사용자 차단',
        expect.stringContaining('타인'),
        expect.any(Array)
      );
    });

    it('차단 확인 Alert에서 차단을 누르면 block.mutate를 호출한다', () => {
      const { UNSAFE_getByType, getByText } = render(
        <Information name="타인" id={2} isMe={false} isBlocked={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('차단하기'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const confirmButton = buttons.find((b: { text: string }) => b.text === '차단');
      confirmButton.onPress();

      expect(mockBlockMutate).toHaveBeenCalled();
    });

    it('isBlocked가 true이면 "차단 해제하기"를 표시하고 누르면 해제 확인 Alert를 띄운다', () => {
      const { UNSAFE_getByType, getByText } = render(
        <Information name="타인" id={2} isMe={false} isBlocked />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('차단 해제하기'));

      expect(Alert.alert).toHaveBeenCalledWith(
        '차단 해제',
        expect.stringContaining('타인'),
        expect.any(Array)
      );
    });

    it('차단 해제 확인 Alert에서 해제를 누르면 unblock.mutate를 호출한다', () => {
      const { UNSAFE_getByType, getByText } = render(
        <Information name="타인" id={2} isMe={false} isBlocked />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('차단 해제하기'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const confirmButton = buttons.find((b: { text: string }) => b.text === '해제');
      confirmButton.onPress();

      expect(mockUnblockMutate).toHaveBeenCalled();
    });

    it('신고하기를 누르면 메뉴를 닫고 신고 모달을 연다', async () => {
      const { UNSAFE_getByType, getByText, queryByText } = render(
        <Information name="타인" id={2} isMe={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => expect(queryByText('신고하기')).toBeNull());
    });

    it('메뉴에서 취소를 누르면 메뉴가 닫힌다', () => {
      const { UNSAFE_getByType, getByText, queryByText } = render(
        <Information name="타인" id={2} isMe={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      expect(getByText('차단하기')).toBeTruthy();

      fireEvent.press(getByText('취소'));

      expect(queryByText('차단하기')).toBeNull();
    });

    it('신고 모달의 onClose를 호출하면 isReportVisible이 false가 된다', async () => {
      const { UNSAFE_getByType, getByText, getByTestId, queryByTestId } = render(
        <Information name="타인" id={2} isMe={false} />
      );

      fireEvent.press(UNSAFE_getByType(TouchableOpacity));
      fireEvent.press(getByText('신고하기'));

      await waitFor(() => expect(getByTestId('report-modal-close')).toBeTruthy());

      fireEvent.press(getByTestId('report-modal-close'));

      await waitFor(() => expect(queryByTestId('report-modal-close')).toBeNull());
    });

    it('block/unblock이 진행 중이면 더보기 버튼이 비활성화된다', () => {
      mockUseBlockUser.mockReturnValue({
        block: { mutate: mockBlockMutate, isPending: true },
        unblock: { mutate: mockUnblockMutate, isPending: false },
      });

      const { UNSAFE_getByType } = render(<Information name="타인" id={2} isMe={false} />);

      expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
    });
  });
});
