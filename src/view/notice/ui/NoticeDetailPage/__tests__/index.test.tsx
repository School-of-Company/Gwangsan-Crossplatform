import React from 'react';
import { renderWithProviders } from '~/test-utils';
import NoticeDetailPage from '../index';

import { useLocalSearchParams } from 'expo-router';
import { useGetNoticeDetail } from '~/entity/notice/model/useGetNoticeDetail';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('~/entity/notice/model/useGetNoticeDetail', () => ({
  useGetNoticeDetail: jest.fn(),
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: { headerTitle: string }) => {
    const { Text } = require('react-native');
    return <Text testID="header">{headerTitle}</Text>;
  },
}));

jest.mock('~/widget/notice', () => ({
  NoticeDetailSlideViewer: ({ notice }: { notice: { images: unknown[] } }) => {
    const { View } = require('react-native');
    return <View testID="slide-viewer" />;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetNoticeDetail = useGetNoticeDetail as jest.Mock;

describe('NoticeDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: '1' });
  });

  it('로딩 중일 때 ActivityIndicator를 표시한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<NoticeDetailPage />);

    const indicators = UNSAFE_getAllByType(require('react-native').ActivityIndicator);
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it('에러 상태일 때 에러 메시지를 표시한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    });

    const { getByText } = renderWithProviders(<NoticeDetailPage />);

    expect(getByText('공지사항을 불러오는데 실패했습니다.')).toBeTruthy();
  });

  it('data가 null이면 에러 UI를 표시한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { getByText } = renderWithProviders(<NoticeDetailPage />);

    expect(getByText('공지사항을 불러오는데 실패했습니다.')).toBeTruthy();
  });

  it('공지 상세를 정상적으로 렌더링한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: {
        id: 1,
        title: '테스트 공지',
        content: '공지 내용입니다.',
        place: '광산구청',
        createdAt: '2025-01-15',
        role: 'ROLE_PLACE_ADMIN',
        images: [],
      },
      isLoading: false,
      error: null,
    });

    const { getByText } = renderWithProviders(<NoticeDetailPage />);

    expect(getByText('테스트 공지')).toBeTruthy();
    expect(getByText('공지 내용입니다.')).toBeTruthy();
    expect(getByText('광산구청')).toBeTruthy();
    expect(getByText('2025-01-15')).toBeTruthy();
  });

  it('이미지가 있으면 SlideViewer를 렌더링한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: {
        id: 1,
        title: '이미지 공지',
        content: '내용',
        place: '',
        createdAt: '',
        role: 'ROLE_PLACE_ADMIN',
        images: [{ imageId: 1, imageUrl: 'https://example.com/1.png' }],
      },
      isLoading: false,
      error: null,
    });

    const { getByTestId } = renderWithProviders(<NoticeDetailPage />);

    expect(getByTestId('slide-viewer')).toBeTruthy();
  });

  it('이미지가 없으면 SlideViewer를 렌더링하지 않는다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: {
        id: 1,
        title: '공지',
        content: '내용',
        place: '',
        createdAt: '',
        role: 'ROLE_PLACE_ADMIN',
        images: [],
      },
      isLoading: false,
      error: null,
    });

    const { queryByTestId } = renderWithProviders(<NoticeDetailPage />);

    expect(queryByTestId('slide-viewer')).toBeNull();
  });

  it('place가 빈 문자열이면 빈 텍스트를 표시한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: {
        id: 1,
        title: '공지',
        content: '내용',
        place: '',
        createdAt: '2025-01-15',
        role: 'ROLE_PLACE_ADMIN',
        images: [],
      },
      isLoading: false,
      error: null,
    });

    const { getByText } = renderWithProviders(<NoticeDetailPage />);

    // place가 빈 문자열이어도 크래시하지 않아야 함
    expect(getByText('내용')).toBeTruthy();
  });

  it('헤더에 "공지" 타이틀을 표시한다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { getByTestId } = renderWithProviders(<NoticeDetailPage />);

    expect(getByTestId('header').props.children).toBe('공지');
  });

  it('images가 undefined인 경우에도 크래시하지 않는다', () => {
    mockUseGetNoticeDetail.mockReturnValue({
      data: {
        id: 1,
        title: '공지',
        content: '내용',
        place: '',
        createdAt: '',
        role: 'ROLE_PLACE_ADMIN',
        images: undefined,
      },
      isLoading: false,
      error: null,
    });

    // images가 undefined이면 hasImages가 falsy → SlideViewer 미렌더링
    const { queryByTestId } = renderWithProviders(<NoticeDetailPage />);

    expect(queryByTestId('slide-viewer')).toBeNull();
  });
});
