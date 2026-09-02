import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import PurchasedPageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyPosts } from '~/view/profile/model/useGetMyPosts';
import { useGetPosts } from '~/view/profile/model/useGetPosts';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
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

const push = jest.fn();
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyPosts = useGetMyPosts as jest.Mock;
const mockUseGetPosts = useGetPosts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseRouter.mockReturnValue({ push });
  mockUseGetProfile.mockReturnValue({ data: undefined, error: null, isError: false });
  mockUseGetMyPosts.mockReturnValue({ data: [], error: null, isError: false });
  mockUseGetPosts.mockReturnValue({ data: [], error: null, isError: false });
});

describe('PurchasedPageView', () => {
  it('본인 프로필일 때 "거래내역" 타이틀을 표시한다', () => {
    const { getByTestId } = render(<PurchasedPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(true);
    expect(mockUseGetPosts).toHaveBeenCalledWith(undefined);

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('거래내역');
  });

  it('상대방 프로필일 때 "{닉네임}님의 거래 내역" 타이틀을 표시한다', () => {
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
    expect(header.headerTitle).toBe('상대방님의 거래 내역');
  });

  it('기본 탭은 "구매내역"이며, 게시물이 없으면 두 패널 모두 안내 문구를 표시한다', () => {
    const { getByText } = render(<PurchasedPageView />);

    expect(getByText('구매내역(active)')).toBeTruthy();
    expect(getByText('구매 내역이 없습니다.')).toBeTruthy();
    expect(getByText('판매 내역이 없습니다.')).toBeTruthy();
  });

  it('완료된 RECEIVER 게시물은 구매내역에, 완료된 GIVER 게시물은 판매내역에 렌더링한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        { id: 1, title: '판매중글', gwangsan: 1, mode: 'GIVER', isCompleted: false },
        { id: 2, title: '구매완료글', gwangsan: 2, mode: 'RECEIVER', isCompleted: true },
        { id: 3, title: '구매진행중글', gwangsan: 3, mode: 'RECEIVER', isCompleted: false },
        { id: 4, title: '판매완료글', gwangsan: 4, mode: 'GIVER', isCompleted: true },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, queryByTestId, getByText } = render(<PurchasedPageView />);

    expect(getByTestId('purchased-card-2')).toBeTruthy();
    expect(getByText('구매완료글')).toBeTruthy();
    expect(queryByTestId('purchased-card-1')).toBeNull();
    expect(queryByTestId('purchased-card-3')).toBeNull();
    expect(getByTestId('sold-card-4')).toBeTruthy();
    expect(getByText('판매완료글')).toBeTruthy();
  });

  it('구매내역 카드에 판매자 닉네임을 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 2,
          title: '구매완료글',
          gwangsan: 2,
          mode: 'RECEIVER',
          isCompleted: true,
          seller: { memberId: 9, nickname: '홍길동' },
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<PurchasedPageView />);

    expect(getByTestId('purchased-card-seller-2')).toHaveTextContent('판매자 홍길동');
  });

  it('판매내역 카드에 구매자 닉네임을 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 4,
          title: '판매완료글',
          gwangsan: 4,
          mode: 'GIVER',
          isCompleted: true,
          buyer: { memberId: 9, nickname: '김철수' },
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<PurchasedPageView />);

    expect(getByTestId('sold-card-buyer-4')).toHaveTextContent('구매자 김철수');
  });

  it('"판매내역" 탭을 누르면 해당 탭이 활성화된다', () => {
    const { getByTestId, getByText } = render(<PurchasedPageView />);

    fireEvent.press(getByTestId('trade-tab-sold'));

    expect(getByText('판매내역(active)')).toBeTruthy();
  });

  it('카드를 누르면 상세 페이지로 이동한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [{ id: 2, title: '구매완료글', gwangsan: 2, mode: 'RECEIVER', isCompleted: true }],
      error: null,
      isError: false,
    });

    const { getByTestId } = render(<PurchasedPageView />);

    fireEvent.press(getByTestId('purchased-card-2'));

    expect(push).toHaveBeenCalledWith('/post/2');
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
