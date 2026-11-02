import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGetMyFeedback } from '~/entity/feedback';
import FeedbackDetailPage from '../index';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: { back: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('~/shared/lib/axios', () => ({ instance: {} }));

jest.mock('~/entity/feedback', () => ({
  ...jest.requireActual('~/entity/feedback'),
  useGetMyFeedback: jest.fn(),
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetMyFeedback = useGetMyFeedback as jest.Mock;

const feedback = {
  feedbackId: 3,
  type: 'BUG',
  content: '채팅이 안 보내져요.',
  images: [
    { imageId: 11, imageUrl: 'https://img/11.png' },
    { imageId: 12, imageUrl: 'https://img/12.png' },
  ],
  status: 'DONE',
  answer: '업데이트로 해결했습니다.',
  answeredAt: '2026-11-02T15:30:00',
  createdAt: '2026-11-01T09:05:00',
};

const mockResult = (overrides: Record<string, unknown> = {}) =>
  mockUseGetMyFeedback.mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    ...overrides,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ id: '3' });
});

describe('FeedbackDetailPage', () => {
  it('라우트 id를 숫자로 바꿔 조회한다', () => {
    mockResult({ data: feedback });

    render(<FeedbackDetailPage />);

    expect(mockUseGetMyFeedback).toHaveBeenCalledWith(3);
  });

  it('내용, 첨부 이미지, 관리자 답변과 답변 시각을 보여준다', () => {
    mockResult({ data: feedback });

    const { getByText, getByTestId } = render(<FeedbackDetailPage />);

    expect(getByText('오류/버그')).toBeTruthy();
    expect(getByText('완료')).toBeTruthy();
    expect(getByText('2026.11.01 09:05')).toBeTruthy();
    expect(getByText('채팅이 안 보내져요.')).toBeTruthy();
    expect(getByTestId('feedback-image-11')).toBeTruthy();
    expect(getByTestId('feedback-image-12')).toBeTruthy();
    expect(getByText('업데이트로 해결했습니다.')).toBeTruthy();
    expect(getByText('2026.11.02 15:30')).toBeTruthy();
  });

  it('답변이 없으면 대기 문구를 보여준다', () => {
    mockResult({
      data: { ...feedback, images: [], status: 'RECEIVED', answer: null, answeredAt: null },
    });

    const { getByText, queryByTestId } = render(<FeedbackDetailPage />);

    expect(getByText('아직 답변이 등록되지 않았습니다.')).toBeTruthy();
    expect(getByText('접수')).toBeTruthy();
    expect(queryByTestId('feedback-image-11')).toBeNull();
  });

  it('로딩 중에는 로딩 표시를 보여준다', () => {
    mockResult({ isPending: true });

    const { getByTestId } = render(<FeedbackDetailPage />);

    expect(getByTestId('feedback-detail-loading')).toBeTruthy();
  });

  it('조회에 실패하면 오류 문구를 보여준다', () => {
    mockResult({ isError: true });

    const { getByText } = render(<FeedbackDetailPage />);

    expect(getByText('문의를 불러오지 못했습니다.')).toBeTruthy();
  });

  it('내 문의가 아니거나 없으면 찾을 수 없다고 보여준다', () => {
    mockResult({ data: null });

    const { getByText } = render(<FeedbackDetailPage />);

    expect(getByText('문의를 찾을 수 없습니다.')).toBeTruthy();
  });

  it('잘못된 id면 조회하지 않고 찾을 수 없다고 보여준다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: 'abc' });
    mockResult({ isPending: true });

    const { getByText } = render(<FeedbackDetailPage />);

    expect(mockUseGetMyFeedback).toHaveBeenCalledWith(undefined);
    expect(getByText('문의를 찾을 수 없습니다.')).toBeTruthy();
  });
});
