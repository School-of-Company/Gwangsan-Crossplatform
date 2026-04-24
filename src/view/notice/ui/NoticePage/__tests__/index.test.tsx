import React from 'react';
import { renderWithProviders } from '~/test-utils';
import NoticePage from '../index';

import { useGetNoticeList } from '~/entity/notice/model/useGetNoticeList';

const mockRefetch = jest.fn().mockResolvedValue({});

jest.mock('~/entity/notice/model/useGetNoticeList', () => ({
  useGetNoticeList: jest.fn(),
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: { headerTitle: string }) => {
    const { Text } = require('react-native');
    return <Text testID="header">{headerTitle}</Text>;
  },
}));

jest.mock('~/shared/ui/Footer', () => ({
  Footer: () => {
    const { View } = require('react-native');
    return <View testID="footer" />;
  },
}));

jest.mock('~/widget/notice', () => ({
  NoticeItem: ({
    id,
    title,
  }: {
    id: number;
    title: string;
    content: string;
    images: unknown[];
  }) => {
    const { Text } = require('react-native');
    return <Text testID={`notice-item-${id}`}>{title}</Text>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

const mockUseGetNoticeList = useGetNoticeList as jest.Mock;

describe('NoticePage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('로딩 중일 때 ActivityIndicator를 표시한다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<NoticePage />);

    const indicators = UNSAFE_getAllByType(require('react-native').ActivityIndicator);
    expect(indicators.length).toBeGreaterThanOrEqual(1);
  });

  it('에러 상태일 때 에러 메시지를 표시한다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    const { getByText } = renderWithProviders(<NoticePage />);

    expect(getByText('공지사항을 불러오는데 실패했습니다.')).toBeTruthy();
  });

  it('데이터가 있으면 공지 목록을 렌더링한다', () => {
    const list = [
      { id: 1, title: '공지1', content: '내용1', images: [] },
      { id: 2, title: '공지2', content: '내용2', images: [] },
    ];
    mockUseGetNoticeList.mockReturnValue({
      data: list,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<NoticePage />);

    expect(getByTestId('notice-item-1')).toBeTruthy();
    expect(getByTestId('notice-item-2')).toBeTruthy();
  });

  it('빈 목록이면 공지 아이템을 렌더링하지 않는다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { queryByTestId } = renderWithProviders(<NoticePage />);

    expect(queryByTestId('notice-item-1')).toBeNull();
  });

  it('헤더에 "공지" 타이틀을 표시한다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<NoticePage />);

    expect(getByTestId('header').props.children).toBe('공지');
  });

  it('Footer를 렌더링한다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<NoticePage />);

    expect(getByTestId('footer')).toBeTruthy();
  });

  it('로딩 중이지만 캐시 데이터가 있으면 목록을 표시한다 (refetch 중)', () => {
    const list = [{ id: 1, title: '캐시 공지', content: '내용', images: [] }];
    mockUseGetNoticeList.mockReturnValue({
      data: list,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<NoticePage />);

    expect(getByTestId('notice-item-1')).toBeTruthy();
  });

  it('에러 상태이지만 캐시 데이터가 있으면 목록을 표시한다', () => {
    const list = [{ id: 1, title: '캐시 공지', content: '내용', images: [] }];
    mockUseGetNoticeList.mockReturnValue({
      data: list,
      isLoading: false,
      error: new Error('Stale'),
      refetch: mockRefetch,
    });

    const { getByTestId } = renderWithProviders(<NoticePage />);

    expect(getByTestId('notice-item-1')).toBeTruthy();
  });

  it('에러 상태(데이터 없음)에서 RefreshControl이 있는 ScrollView를 렌더링한다', () => {
    mockUseGetNoticeList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    const { UNSAFE_getAllByType } = renderWithProviders(<NoticePage />);

    const scrollViews = UNSAFE_getAllByType(require('react-native').ScrollView);
    expect(scrollViews.length).toBeGreaterThanOrEqual(1);
  });
});
