import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useGetAlertList } from '~/entity/notification';
import { AlertType } from '~/entity/notification/model/alertTypes';
import NotificationPage from '../index';

jest.mock('~/entity/notification', () => ({
  useGetAlertList: jest.fn(),
}));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle }: { headerTitle: string }) => {
    const { Text } = require('react-native');
    return <Text testID="header">{headerTitle}</Text>;
  },
}));

jest.mock('~/widget/notification/ui/NotificationItem', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ id, title }: { id: number; title: string }) => (
      <Text testID={`notification-item-${id}`}>{title}</Text>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseGetAlertList = useGetAlertList as jest.Mock;
const mockRefetch = jest.fn().mockResolvedValue({});

beforeEach(() => jest.clearAllMocks());

const makeAlert = (overrides = {}) => ({
  id: 1,
  title: '알림 제목',
  content: '알림 내용',
  alertType: AlertType.NOTICE,
  createdAt: '2026-01-01T00:00:00Z',
  images: [],
  sendMemberId: 1,
  sourceId: 1,
  ...overrides,
});

describe('NotificationPage', () => {
  it('로딩 중일 때 ActivityIndicator를 표시한다', () => {
    mockUseGetAlertList.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    const { UNSAFE_getAllByType } = render(<NotificationPage />);

    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getAllByType(ActivityIndicator).length).toBeGreaterThanOrEqual(1);
  });

  it('에러 상태일 때 에러 메시지를 표시한다', () => {
    mockUseGetAlertList.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: mockRefetch,
    });

    const { getByText } = render(<NotificationPage />);

    expect(getByText('알림을 불러오는데 실패했습니다.')).toBeTruthy();
  });

  it('apiResponse가 없으면 데이터가 있어도 에러 메시지를 표시한다', () => {
    mockUseGetAlertList.mockReturnValue({
      data: [makeAlert()],
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: mockRefetch,
    });

    const { getByText } = render(<NotificationPage />);

    expect(getByText('알림을 불러오는데 실패했습니다.')).toBeTruthy();
  });

  it('데이터가 있으면 알림 목록을 렌더링한다', () => {
    const list = [makeAlert({ id: 1, title: '알림1' }), makeAlert({ id: 2, title: '알림2' })];
    mockUseGetAlertList.mockReturnValue({
      data: list,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = render(<NotificationPage />);

    expect(getByTestId('notification-item-1').props.children).toBe('알림1');
    expect(getByTestId('notification-item-2').props.children).toBe('알림2');
  });

  it('빈 목록이면 알림 아이템을 렌더링하지 않는다', () => {
    mockUseGetAlertList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { queryByTestId } = render(<NotificationPage />);

    expect(queryByTestId('notification-item-1')).toBeNull();
  });

  it('헤더에 "알림" 타이틀을 표시한다', () => {
    mockUseGetAlertList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = render(<NotificationPage />);

    expect(getByTestId('header').props.children).toBe('알림');
  });

  it('id가 없는 알림은 index를 key/id로 사용해 렌더링한다', () => {
    const list = [makeAlert({ id: undefined, title: '아이디없음' })];
    mockUseGetAlertList.mockReturnValue({
      data: list,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByTestId } = render(<NotificationPage />);

    expect(getByTestId('notification-item-0').props.children).toBe('아이디없음');
  });

  it('당겨서 새로고침 시 refetch가 호출된다', async () => {
    mockUseGetAlertList.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { UNSAFE_getByType } = render(<NotificationPage />);
    const { ScrollView } = require('react-native');
    const scrollView = UNSAFE_getByType(ScrollView);

    await waitFor(() => {
      scrollView.props.refreshControl.props.onRefresh();
    });

    expect(mockRefetch).toHaveBeenCalled();
  });
});
