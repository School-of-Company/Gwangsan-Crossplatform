import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { AlertType } from '~/entity/notification/model/alertTypes';
import NotificationItem from '../index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockNavigateToChat = jest.fn();
const mockNavigateToRoom = jest.fn();
jest.mock('~/entity/chat/model/useChatEntry', () => ({
  useChatEntry: () => ({
    navigateToChat: mockNavigateToChat,
    navigateToRoom: mockNavigateToRoom,
  }),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.Mock;

const baseProps = {
  title: '거래 알림',
  content: '내용입니다',
  alertType: AlertType.NOTICE,
  images: [],
  createdAt: new Date().toISOString(),
  sourceId: 10,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
});

describe('NotificationItem — 기본 렌더링', () => {
  it('title과 content를 렌더링한다', () => {
    const { getByText } = render(<NotificationItem {...baseProps} />);

    expect(getByText('거래 알림')).toBeTruthy();
    expect(getByText('내용입니다')).toBeTruthy();
  });

  it('알림 이미지에 대체 텍스트를 지정한다', () => {
    const { getByLabelText } = render(<NotificationItem {...baseProps} />);

    expect(getByLabelText('광산 알림 아이콘')).toBeTruthy();
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

  it('REVIEW 타입 클릭 시 거래취소 화면으로 이동한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.REVIEW} sourceId={5} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).toHaveBeenCalledWith('/cancelTrade/5');
  });

  it('NOTICE 타입 클릭 시 공지 상세로 이동한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.NOTICE} sourceId={3} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).toHaveBeenCalledWith('/notice/3');
  });

  it('FEEDBACK_ANSWER 타입 클릭 시 sourceId의 문의 상세로 이동한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.FEEDBACK_ANSWER} sourceId={12} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).toHaveBeenCalledWith('/feedback/12');
  });

  it('CHTTING_REQUEST 타입 클릭 시 상품 채팅방으로 진입한다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.CHTTING_REQUEST} sourceId={8} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockNavigateToChat).toHaveBeenCalledWith(8);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('이동할 곳이 없는 타입 클릭 시 이동하지 않는다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.RECOMMENDER} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockNavigateToChat).not.toHaveBeenCalled();
  });

  it('sourceId가 0이면 이동하지 않는다', () => {
    const { getByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.FEEDBACK_ANSWER} sourceId={0} />
    );

    fireEvent.press(getByText('거래 알림'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('OTHER_MEMBER_TRADE_COMPLETE 타입에는 거래 완료 수락 버튼을 렌더링하지 않는다', () => {
    const { queryByText } = render(
      <NotificationItem {...baseProps} alertType={AlertType.OTHER_MEMBER_TRADE_COMPLETE} />
    );

    expect(queryByText('거래 완료 수락')).toBeNull();
  });
});
