import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { requestTrade } from '~/entity/post/api/requestTrade';
import { useGetItem } from '~/entity/post/model/useGetItem';
import { AlertType } from '~/entity/notification/model/alertTypes';
import NotificationItem from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('~/entity/post/api/requestTrade', () => ({
  requestTrade: jest.fn(),
}));

jest.mock('~/entity/post/model/useGetItem', () => ({
  useGetItem: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.Mock;
const mockRequestTrade = requestTrade as jest.Mock;
const mockUseGetItem = useGetItem as jest.Mock;

const baseProps = {
  title: '거래 알림',
  content: '내용입니다',
  alertType: AlertType.NOTICE,
  images: [],
  createdAt: new Date().toISOString(),
  sendMemberId: 1,
  sourceId: 10,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseGetItem.mockReturnValue({ data: undefined });
});

describe('NotificationItem — 기본 렌더링', () => {
  it('title과 content를 렌더링한다', () => {
    const { getByText } = render(<NotificationItem {...baseProps} />);

    expect(getByText('거래 알림')).toBeTruthy();
    expect(getByText('내용입니다')).toBeTruthy();
  });
});

describe('NotificationItem — 클릭 동작', () => {
  it('TRADE_COMPLETE 타입 클릭 시 리뷰 작성 화면으로 이동한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.TRADE_COMPLETE} sourceId={5} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).toHaveBeenCalledWith('/post/5?review=1');
  });

  it('REVIEW 타입 클릭 시 거래철회 화면으로 이동한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.REVIEW} sourceId={5} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).toHaveBeenCalledWith('/cancelTrade/5');
  });

  it('그 외 타입 클릭 시 이동하지 않는다', () => {
    const { getByText } = render(<NotificationItem {...baseProps} alertType={AlertType.NOTICE} />);

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('NotificationItem — 거래 완료 수락 버튼', () => {
  it('OTHER_MEMBER_TRADE_COMPLETE이고 완료 가능하며 미완료 상태면 수락 버튼을 표시한다', () => {
    mockUseGetItem.mockReturnValue({ data: { isCompletable: true, isCompleted: false } });

    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE} />
    );

    expect(getByText('거래 완료 수락')).toBeTruthy();
  });

  it('isCompletable이 false이면 수락 버튼을 표시하지 않는다', () => {
    mockUseGetItem.mockReturnValue({ data: { isCompletable: false, isCompleted: false } });

    const { queryByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE} />
    );

    expect(queryByText('거래 완료 수락')).toBeNull();
  });

  it('isCompleted가 true이면 수락 버튼을 표시하지 않는다', () => {
    mockUseGetItem.mockReturnValue({ data: { isCompletable: true, isCompleted: true } });

    const { queryByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE} />
    );

    expect(queryByText('거래 완료 수락')).toBeNull();
  });

  it('다른 알림 타입이면 postId를 조회하지 않아 useGetItem이 undefined로 호출된다', () => {
    render(<NotificationItem {...baseProps} alertType={AlertType.NOTICE} />);

    expect(mockUseGetItem).toHaveBeenCalledWith(undefined);
  });

  it('수락 버튼 클릭 시 성공 Toast를 표시하고 requestTrade를 호출한다', async () => {
    mockUseGetItem.mockReturnValue({ data: { isCompletable: true, isCompleted: false } });
    mockRequestTrade.mockResolvedValue({ success: true, roomId: 1 });

    const { getByText } = render(
      <NotificationItem
        {...baseProps}
        alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE}
        sourceId={7}
        sendMemberId={3}
      />
    );

    fireEvent.press(getByText('거래 완료 수락'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success', text1: '거래 완료 수락 완료' })
      );
    });

    await waitFor(() => {
      expect(mockRequestTrade).toHaveBeenCalledWith({ productId: 7, otherMemberId: 3 });
    });

    await waitFor(() => {
      expect(getByText('수락 완료')).toBeTruthy();
    });
  });

  it('수락 실패 시 에러 Toast를 표시하고 수락 상태를 되돌린다', async () => {
    mockUseGetItem.mockReturnValue({ data: { isCompletable: true, isCompleted: false } });
    mockRequestTrade.mockRejectedValue(new Error('거래 수락 실패'));

    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE} />
    );

    fireEvent.press(getByText('거래 완료 수락'));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          text1: '거래 완료 수락 실패',
          text2: '거래 수락 실패',
        })
      );
    });

    await waitFor(() => {
      expect(getByText('거래 완료 수락')).toBeTruthy();
    });
  });
});
