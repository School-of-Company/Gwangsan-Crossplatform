import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import SellingPageView from '../index';
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
  PillTabs: ({ tabs, value, onChange, testIDPrefix }: any) => {
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        {tabs.map((tab: any) => (
          <TouchableOpacity
            key={tab.value}
            testID={`${testIDPrefix}-${tab.value}`}
            onPress={() => onChange(tab.value)}>
            <Text>{`${tab.label}${tab.value === value ? '(active)' : ''}`}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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

describe('SellingPageView', () => {
  it('본인 프로필일 때 "판매관리" 타이틀을 표시한다', () => {
    const { getByTestId } = render(<SellingPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(true);
    expect(mockUseGetPosts).toHaveBeenCalledWith(undefined);

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('판매관리');
  });

  it('상대방 프로필일 때 "{닉네임}님의 판매 목록" 타이틀을 표시한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '5' });
    mockUseGetProfile.mockReturnValue({
      data: { nickname: '상대방' },
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<SellingPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(false);
    expect(mockUseGetPosts).toHaveBeenCalledWith('5');

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('상대방님의 판매 목록');
  });

  it('기본 탭은 "판매중"이며 GIVER 게시물이 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<SellingPageView />);

    expect(getByText('판매중(active)')).toBeTruthy();
    expect(getByText('판매 중인 게시물이 없습니다.')).toBeTruthy();
  });

  it('"판매중" 탭은 완료되지 않은 GIVER 게시물만 렌더링하고, RECEIVER/완료된 게시물은 제외한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        { id: 1, title: '판매중글', mode: 'GIVER', isCompleted: false },
        { id: 2, title: '구매글', mode: 'RECEIVER', isCompleted: false },
        { id: 3, title: '판매완료글', mode: 'GIVER', isCompleted: true },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, queryByTestId } = render(<SellingPageView />);

    expect(getByTestId('post-1')).toBeTruthy();
    expect(queryByTestId('post-2')).toBeNull();
    expect(queryByTestId('post-3')).toBeNull();
  });

  it('"판매완료" 탭을 누르면 완료된 GIVER 게시물만 렌더링한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        { id: 1, title: '판매중글', mode: 'GIVER', isCompleted: false },
        { id: 3, title: '판매완료글', mode: 'GIVER', isCompleted: true },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, queryByTestId } = render(<SellingPageView />);

    fireEvent.press(getByTestId('selling-tab-sold'));

    expect(getByTestId('post-3')).toBeTruthy();
    expect(queryByTestId('post-1')).toBeNull();
  });

  it('"판매완료" 탭에 게시물이 없으면 안내 문구를 표시한다', () => {
    const { getByTestId, getByText } = render(<SellingPageView />);

    fireEvent.press(getByTestId('selling-tab-sold'));

    expect(getByText('판매 완료된 게시물이 없습니다.')).toBeTruthy();
  });

  it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: undefined,
      error: new Error('게시물 오류'),
      isError: true,
    });

    render(<SellingPageView />);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
    );
  });
});
