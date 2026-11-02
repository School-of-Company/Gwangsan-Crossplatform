import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { useGetMyFeedbacks } from '~/entity/feedback';
import FeedbackListPage from '../index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  router: { back: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('~/shared/lib/axios', () => ({ instance: {} }));

jest.mock('~/entity/feedback', () => ({
  ...jest.requireActual('~/entity/feedback'),
  useGetMyFeedbacks: jest.fn(),
}));

const mockUseGetMyFeedbacks = useGetMyFeedbacks as jest.Mock;

const makeFeedback = (feedbackId: number, overrides: Record<string, unknown> = {}) => ({
  feedbackId,
  type: 'BUG',
  content: `문의 내용 ${feedbackId}`,
  images: [],
  status: 'RECEIVED',
  answer: null,
  answeredAt: null,
  createdAt: '2026-11-01T10:00:00',
  ...overrides,
});

const baseResult = {
  feedbacks: [] as unknown[],
  isPending: false,
  isError: false,
  isRefetching: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  loadMore: jest.fn(),
  retryNextPage: jest.fn(),
  refetch: jest.fn(),
};

const mockResult = (overrides: Partial<typeof baseResult> & Record<string, unknown> = {}) =>
  mockUseGetMyFeedbacks.mockReturnValue({ ...baseResult, ...overrides });

beforeEach(() => jest.clearAllMocks());

describe('FeedbackListPage', () => {
  it('문의 카드에 유형, 내용, 작성일, 처리 상태를 보여준다', () => {
    mockResult({
      feedbacks: [
        makeFeedback(2, { type: 'TRADE', status: 'DONE' }),
        makeFeedback(1, { status: 'IN_PROGRESS' }),
      ],
    });

    const { getByText, getAllByText } = render(<FeedbackListPage />);

    expect(getByText('거래 관련')).toBeTruthy();
    expect(getByText('문의 내용 2')).toBeTruthy();
    expect(getByText('완료')).toBeTruthy();
    expect(getByText('처리중')).toBeTruthy();
    expect(getByText('오류/버그')).toBeTruthy();
    expect(getAllByText('2026.11.01')).toHaveLength(2);
  });

  it('카드를 누르면 문의 상세로 이동한다', () => {
    mockResult({ feedbacks: [makeFeedback(7)] });

    const { getByTestId } = render(<FeedbackListPage />);
    fireEvent.press(getByTestId('feedback-card-7'));

    expect(mockPush).toHaveBeenCalledWith('/feedback/7');
  });

  it('문의하기 버튼을 누르면 작성 화면으로 이동한다', () => {
    mockResult();

    const { getByText } = render(<FeedbackListPage />);
    fireEvent.press(getByText('문의하기'));

    expect(mockPush).toHaveBeenCalledWith('/feedback/write');
  });

  it('로딩 중에는 로딩 표시를 보여준다', () => {
    mockResult({ isPending: true });

    const { getByTestId } = render(<FeedbackListPage />);

    expect(getByTestId('feedback-list-loading')).toBeTruthy();
  });

  it('문의가 없으면 빈 안내 문구를 보여준다', () => {
    mockResult();

    const { getByText } = render(<FeedbackListPage />);

    expect(getByText(/아직 보낸 문의가 없습니다/)).toBeTruthy();
  });

  it('조회에 실패하면 오류 문구를 보여준다', () => {
    mockResult({ isError: true });

    const { getByText } = render(<FeedbackListPage />);

    expect(getByText(/문의 내역을 불러오지 못했습니다/)).toBeTruthy();
  });

  it('다음 페이지를 받는 중이면 하단 로딩을 보여준다', () => {
    mockResult({ feedbacks: [makeFeedback(1)], isFetchingNextPage: true });

    const { getByTestId } = render(<FeedbackListPage />);

    expect(getByTestId('feedback-list-loading-more')).toBeTruthy();
  });

  it('다음 페이지 조회가 실패하면 재시도 버튼으로 다시 받는다', () => {
    mockResult({ feedbacks: [makeFeedback(1)], isFetchNextPageError: true });

    const { getByTestId } = render(<FeedbackListPage />);
    fireEvent.press(getByTestId('feedback-list-retry'));

    expect(baseResult.retryNextPage).toHaveBeenCalled();
  });

  it('목록 끝에 닿으면 다음 페이지를 요청한다', () => {
    mockResult({ feedbacks: [makeFeedback(1)] });

    const { getByTestId } = render(<FeedbackListPage />);
    fireEvent(getByTestId('feedback-list'), 'onEndReached');

    expect(baseResult.loadMore).toHaveBeenCalled();
  });
});
