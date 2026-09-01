import React from 'react';
import { render } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import PurchasedPageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
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
jest.mock('~/view/profile/model/useGetMyPosts', () => ({ useGetMyPosts: jest.fn() }));
jest.mock('~/view/profile/model/useGetPosts', () => ({ useGetPosts: jest.fn() }));

jest.mock('~/shared/ui', () => ({
  Header: ({ headerTitle, showBackButton }: any) => {
    const { Text } = require('react-native');
    return <Text testID="header">{JSON.stringify({ headerTitle, showBackButton })}</Text>;
  },
}));

jest.mock('~/shared/ui/Post', () => ({
  __esModule: true,
  default: ({ id, title }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`post-${id}`}>{title}</Text>;
  },
}));

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyPosts = useGetMyPosts as jest.Mock;
const mockUseGetPosts = useGetPosts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseGetProfile.mockReturnValue({ data: undefined, error: null, isError: false });
  mockUseGetMyPosts.mockReturnValue({ data: [], error: null, isError: false });
  mockUseGetPosts.mockReturnValue({ data: [], error: null, isError: false });
});

describe('PurchasedPageView', () => {
  it('본인 프로필일 때 "구매내역" 타이틀을 표시한다', () => {
    const { getByTestId } = render(<PurchasedPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(true);
    expect(mockUseGetPosts).toHaveBeenCalledWith(undefined);

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('구매내역');
  });

  it('상대방 프로필일 때 "{닉네임}님의 구매 내역" 타이틀을 표시한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '5' });
    mockUseGetProfile.mockReturnValue({
      data: { nickname: '상대방' },
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<PurchasedPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(false);
    expect(mockUseGetPosts).toHaveBeenCalledWith('5');

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('상대방님의 구매 내역');
  });

  it('완료된 구매 게시물이 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<PurchasedPageView />);

    expect(getByText('구매 내역이 없습니다.')).toBeTruthy();
  });

  it('완료된 RECEIVER 게시물만 렌더링한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        { id: 1, title: '판매글', mode: 'GIVER', isCompleted: true },
        { id: 2, title: '구매완료글', mode: 'RECEIVER', isCompleted: true },
        { id: 3, title: '구매진행중글', mode: 'RECEIVER', isCompleted: false },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, queryByTestId } = render(<PurchasedPageView />);

    expect(getByTestId('post-2')).toBeTruthy();
    expect(queryByTestId('post-1')).toBeNull();
    expect(queryByTestId('post-3')).toBeNull();
  });

  it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: undefined,
      error: new Error('게시물 오류'),
      isError: true,
    });

    render(<PurchasedPageView />);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
    );
  });
});
