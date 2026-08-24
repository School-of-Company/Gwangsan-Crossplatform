import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import CompletedTradesPageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useGetMyPosts } from '~/view/profile/model/useGetMyPosts';
import { useGetPosts } from '~/view/profile/model/useGetPosts';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/view/profile/model/useGetProfile', () => ({ useGetProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetMyProfile', () => ({ useGetMyProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetMyPosts', () => ({ useGetMyPosts: jest.fn() }));
jest.mock('~/view/profile/model/useGetPosts', () => ({ useGetPosts: jest.fn() }));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle, showBackButton }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header">{JSON.stringify({ headerTitle, showBackButton })}</Text>;
  },
}));

jest.mock('~/widget/profile/ui', () => ({
  CompletedTrades: (props: any) => {
    const { Text } = require('react-native');
    return <Text testID="completed-trades">{JSON.stringify(props)}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseGetMyPosts = useGetMyPosts as jest.Mock;
const mockUseGetPosts = useGetPosts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseGetProfile.mockReturnValue({ data: undefined, error: null, isError: false });
  mockUseGetMyProfile.mockReturnValue({ data: { nickname: '나' } });
  mockUseGetMyPosts.mockReturnValue({ data: [], error: null, isError: false });
  mockUseGetPosts.mockReturnValue({ data: [], error: null, isError: false });
});

describe('CompletedTradesPageView', () => {
  it('Header에 "거래 내역" 타이틀과 뒤로가기 버튼을 표시한다', () => {
    const { getByTestId } = render(<CompletedTradesPageView />);

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('거래 내역');
    expect(header.showBackButton).toBe(true);
  });

  it('본인 프로필일 때 isMe=true, showTitle=false로 CompletedTrades에 내 게시물을 전달한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [{ id: 1, title: '완료된 품목', isCompleted: true }],
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<CompletedTradesPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(true);
    const props = JSON.parse(getByTestId('completed-trades').props.children);
    expect(props.isMe).toBe(true);
    expect(props.showTitle).toBe(false);
    expect(props.name).toBe('나');
    expect(props.posts).toHaveLength(1);
  });

  it('상대방 프로필일 때 isMe=false로 상대방 게시물을 전달한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '5' });
    mockUseGetProfile.mockReturnValue({
      data: { nickname: '상대방' },
      error: null,
      isError: false,
    });
    mockUseGetPosts.mockReturnValue({
      data: [{ id: 2, title: '상대방 완료 품목', isCompleted: true }],
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<CompletedTradesPageView />);

    expect(mockUseGetPosts).toHaveBeenCalledWith('5');
    const props = JSON.parse(getByTestId('completed-trades').props.children);
    expect(props.isMe).toBe(false);
    expect(props.name).toBe('상대방');
    expect(props.posts).toHaveLength(1);
  });

  it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: undefined,
      error: new Error('게시물 오류'),
      isError: true,
    });

    render(<CompletedTradesPageView />);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
    );
  });
});
