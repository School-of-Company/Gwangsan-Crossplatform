import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { renderWithProviders } from '~/test-utils';
import SellingPageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useGetSellingPosts } from '~/view/profile/model/useGetSellingPosts';
import { useGetReviews } from '~/view/reviews/model/useGetReviews';
import { deletePost } from '~/entity/post/api/deletePost';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('~/entity/post/api/deletePost', () => ({ deletePost: jest.fn() }));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('~/view/profile/model/useGetProfile', () => ({ useGetProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetMyProfile', () => ({ useGetMyProfile: jest.fn() }));
jest.mock('~/view/profile/model/useGetSellingPosts', () => ({ useGetSellingPosts: jest.fn() }));
jest.mock('~/view/reviews/model/useGetReviews', () => ({ useGetReviews: jest.fn() }));

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
  BottomSheetModalWrapper: ({ isVisible, children }: any) => (isVisible ? children : null),
  Button: ({ children, onPress, disabled, testID }: any) => {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
      </TouchableOpacity>
    );
  },
  AlertModal: ({
    isVisible,
    message,
    confirmText,
    cancelText = '취소',
    onCancel,
    onConfirm,
  }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return isVisible ? (
      <View>
        <Text>{message}</Text>
        {onCancel && (
          <TouchableOpacity testID="delete-alert-cancel" onPress={onCancel}>
            <Text>{cancelText}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID="delete-alert-confirm" onPress={onConfirm}>
          <Text>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    ) : null;
  },
}));

const push = jest.fn();
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseGetProfile = useGetProfile as jest.Mock;
const mockUseGetMyProfile = useGetMyProfile as jest.Mock;
const mockUseGetSellingPosts = useGetSellingPosts as jest.Mock;

const loadMore = jest.fn();
const retryNextPage = jest.fn();
const refetch = jest.fn();

// useGetSellingPosts는 completed를 서버 필터로 넘겨 탭마다 따로 호출되고, 응답에서
// GIVER가 아닌 글은 훅 안에서 걸러진다(useGetSellingPosts 테스트에서 검증).
// 화면 테스트에서는 게시글 한 벌을 주면 실제 훅과 같은 기준으로 나눠 돌려주도록 흉내낸다.
const setSellingPosts = (posts: any[], overrides: Record<string, unknown> = {}) => {
  mockUseGetSellingPosts.mockImplementation(({ completed }: any) => ({
    posts: posts.filter((post) => post.mode === 'GIVER' && Boolean(post.isCompleted) === completed),
    error: null,
    isError: false,
    isPending: false,
    isRefetching: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    loadMore,
    retryNextPage,
    refetch,
    ...overrides,
  }));
};
const mockUseGetReviews = useGetReviews as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseRouter.mockReturnValue({ push });
  mockUseGetProfile.mockReturnValue({ data: undefined, error: null, isError: false });
  mockUseGetMyProfile.mockReturnValue({ data: { memberId: 1, nickname: '나' } });
  setSellingPosts([]);
  mockUseGetReviews.mockReturnValue({ data: [], error: null, isError: false });
});

describe('SellingPageView', () => {
  it('본인 프로필일 때 "판매관리" 타이틀을 표시한다', () => {
    const { getByTestId } = renderWithProviders(<SellingPageView />);

    expect(mockUseGetSellingPosts).toHaveBeenCalledWith({ memberId: undefined, completed: false });
    expect(mockUseGetSellingPosts).toHaveBeenCalledWith({ memberId: undefined, completed: true });

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

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    expect(mockUseGetSellingPosts).toHaveBeenCalledWith({ memberId: '5', completed: false });
    expect(mockUseGetSellingPosts).toHaveBeenCalledWith({ memberId: '5', completed: true });

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('상대방님의 판매 목록');
  });

  it('기본 탭은 "판매중"이며, 게시물이 없으면 두 패널 모두 안내 문구를 표시한다', () => {
    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중(active)')).toBeTruthy();
    expect(getByText('판매 중인 게시물이 없습니다.')).toBeTruthy();
    expect(getByText('판매 완료된 게시물이 없습니다.')).toBeTruthy();
  });

  it('좌우로 나란히 배치된 두 패널에 판매중/판매완료 게시물을 나누어 렌더링한다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
      {
        id: 2,
        title: '구매글',
        type: 'OBJECT',
        mode: 'RECEIVER',
        gwangsan: 3,
        isCompleted: false,
      },
      {
        id: 3,
        title: '판매완료글',
        type: 'SERVICE',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);

    const { getByText, queryByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중글')).toBeTruthy();
    expect(getByText('판매완료글')).toBeTruthy();
    expect(queryByText('구매글')).toBeNull();
  });

  it('카드에 물품 이름, 물건/서비스·판매/구매 여부 문구, 광산 번호를 표시한다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중글')).toBeTruthy();
    expect(getByText('물건을 팔아요')).toBeTruthy();
    expect(getByText('3 광산')).toBeTruthy();
  });

  it('서비스 게시물이면 "서비스를 할 수 있어요" 문구를 표시한다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '출장 세차',
        type: 'SERVICE',
        mode: 'GIVER',
        gwangsan: 7,
        isCompleted: false,
      },
    ]);

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('서비스를 할 수 있어요')).toBeTruthy();
  });

  it('카드를 누르면 상세 페이지로 이동한다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByText('판매중글'));

    expect(push).toHaveBeenCalledWith('/post/1');
  });

  it('점 3개 버튼을 누르면 게시글 수정/삭제하기/닫기 액션 시트가 뜬다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));

    expect(getByText('게시글 수정')).toBeTruthy();
    expect(getByText('삭제하기')).toBeTruthy();
    expect(getByText('닫기')).toBeTruthy();
  });

  it('"게시글 수정"을 누르면 글쓰기 수정 화면으로 이동하고 시트를 닫는다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('게시글 수정'));

    expect(push).toHaveBeenCalledWith('/write?id=1');
    expect(queryByText('게시글 수정')).toBeNull();
  });

  it('"삭제하기"를 누르면 확인 AlertModal을 띄우고, 확인 시 deletePost를 호출한다', async () => {
    (deletePost as jest.Mock).mockResolvedValue(undefined);
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('삭제하기'));

    expect(getByText('이 게시글을 삭제하시겠습니까?')).toBeTruthy();

    act(() => {
      fireEvent.press(getByTestId('delete-alert-confirm'));
    });

    await waitFor(() => expect(deletePost).toHaveBeenCalled());
    expect((deletePost as jest.Mock).mock.calls[0][0]).toBe(1);
  });

  it('예약 중인 게시글은 "삭제하기"를 눌러도 확인창이 뜨지 않고 안내 Toast를 표시한다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
        isReserved: true,
      },
    ]);

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    expect(getByText('예약 중에는 삭제할 수 없어요')).toBeTruthy();

    fireEvent.press(getByText('예약 중에는 삭제할 수 없어요'));

    expect(queryByText('이 게시글을 삭제하시겠습니까?')).toBeNull();
    expect(deletePost).not.toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: '삭제할 수 없어요',
        text2: '예약 중인 게시글은 삭제할 수 없습니다. 예약을 취소한 후 다시 시도해 주세요.',
      })
    );
  });

  it('삭제 확인 AlertModal에서 취소를 누르면 deletePost를 호출하지 않는다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('삭제하기'));
    fireEvent.press(getByTestId('delete-alert-cancel'));

    expect(deletePost).not.toHaveBeenCalled();
    expect(queryByText('이 게시글을 삭제하시겠습니까?')).toBeNull();
  });

  it('"닫기"를 누르면 액션 시트가 닫힌다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
      },
    ]);

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('닫기'));

    expect(queryByText('삭제하기')).toBeNull();
  });

  it('판매완료 카드는 점 3개 메뉴가 없지만, 받은 후기가 없으면 "받은 후기 보기" 버튼도 뜨지 않는다', () => {
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);

    const { queryByTestId, queryByText } = renderWithProviders(<SellingPageView />);

    expect(queryByTestId('selling-card-menu-3')).toBeNull();
    expect(queryByTestId('selling-card-reviews-3')).toBeNull();
    expect(queryByText('받은 후기 보기')).toBeNull();
  });

  it('판매완료 카드로 실제 받은 후기가 있으면 "받은 후기 보기" 버튼이 뜬다', () => {
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);
    mockUseGetReviews.mockReturnValue({
      data: [{ reviewId: 'review-3', productId: 3, reviewerName: '구매자', content: '', light: 5 }],
      error: null,
      isError: false,
    });

    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    expect(getByTestId('selling-card-reviews-3')).toBeTruthy();
    expect(getByText('받은 후기 보기')).toBeTruthy();
  });

  it('판매완료 카드에 구매자 닉네임을 표시한다', () => {
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
        buyer: { memberId: 9, nickname: '홍길동' },
      },
    ]);

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('구매자 홍길동')).toBeTruthy();
  });

  it('판매중 카드에는 구매자 닉네임을 표시하지 않는다', () => {
    setSellingPosts([
      {
        id: 1,
        title: '판매중글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 3,
        isCompleted: false,
        buyer: { memberId: 9, nickname: '홍길동' },
      },
    ]);

    const { queryByText } = renderWithProviders(<SellingPageView />);

    expect(queryByText('구매자 홍길동')).toBeNull();
  });

  it('"받은 후기 보기"를 누르면 해당 거래의 받은 후기 상세로 이동한다', () => {
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);
    mockUseGetReviews.mockReturnValue({
      data: [{ reviewId: 'review-3', productId: 3, reviewerName: '구매자', content: '', light: 5 }],
      error: null,
      isError: false,
    });

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-reviews-3'));

    expect(push).toHaveBeenCalledWith('/cancelTrade/review-3');
  });

  it('상대방 프로필의 판매완료 카드도 매칭되는 받은 후기가 있으면 해당 후기 상세로 이동한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '5' });
    mockUseGetProfile.mockReturnValue({
      data: { nickname: '상대방', memberId: 5 },
      error: null,
      isError: false,
    });
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);
    mockUseGetReviews.mockReturnValue({
      data: [{ reviewId: 'review-3', productId: 3, reviewerName: '구매자', content: '', light: 5 }],
      error: null,
      isError: false,
    });

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-reviews-3'));

    expect(push).toHaveBeenCalledWith('/cancelTrade/review-3');
  });

  it('받은 후기 목록이 아직 로딩 중이면 버튼 대신 로딩 표시를 보여주고 탭할 수 없다', () => {
    setSellingPosts([
      {
        id: 3,
        title: '판매완료글',
        type: 'OBJECT',
        mode: 'GIVER',
        gwangsan: 5,
        isCompleted: true,
      },
    ]);
    // react-query v5에서 쿼리가 아직 enabled:false로 대기 중일 때는 isLoading이 아니라
    // isPending만 true다. 실제 useGetReviews 훅과 동일한 형태로 목을 구성해 이 경우를 재현한다.
    mockUseGetReviews.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isLoading: false,
      isPending: true,
    });

    const { queryByTestId, getByTestId } = renderWithProviders(<SellingPageView />);

    expect(queryByTestId('selling-card-reviews-3')).toBeNull();
    expect(getByTestId('selling-card-reviews-loading-3')).toBeTruthy();
  });

  it('"판매완료" 탭을 누르면 해당 탭이 활성화된다', () => {
    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-tab-sold'));

    expect(getByText('판매완료(active)')).toBeTruthy();
  });

  describe('추가 로딩(커서 페이지네이션)', () => {
    const makePost = (id: number) => ({
      id,
      title: `판매중글${id}`,
      type: 'OBJECT',
      mode: 'GIVER',
      gwangsan: 3,
      isCompleted: false,
    });

    it('목록 끝에 닿으면 다음 페이지를 이어서 요청한다', () => {
      setSellingPosts([makePost(1)], { hasNextPage: true });

      const { getByTestId } = renderWithProviders(<SellingPageView />);

      act(() => {
        getByTestId('selling-panel-onSale').props.onEndReached();
      });

      expect(loadMore).toHaveBeenCalled();
    });

    it('첫 페이지를 불러오는 중에는 빈 안내 문구 대신 로딩 표시를 보여준다', () => {
      setSellingPosts([], { isPending: true });

      const { getByTestId, queryByText } = renderWithProviders(<SellingPageView />);

      expect(getByTestId('selling-panel-onSale-loading')).toBeTruthy();
      expect(queryByText('판매 중인 게시물이 없습니다.')).toBeNull();
    });

    it('다음 페이지를 불러오는 중에는 목록 하단에 로딩 표시를 보여준다', () => {
      setSellingPosts([makePost(1)], { hasNextPage: true, isFetchingNextPage: true });

      const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

      expect(getByTestId('selling-panel-onSale-loading-more')).toBeTruthy();
      // 이미 받은 목록은 그대로 유지된다
      expect(getByText('판매중글1')).toBeTruthy();
    });

    it('추가 로딩에 실패하면 목록을 유지한 채 재시도 버튼을 보여주고, 누르면 다시 요청한다', () => {
      setSellingPosts([makePost(1)], { hasNextPage: true, isFetchNextPageError: true });

      const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

      expect(getByText('판매중글1')).toBeTruthy();

      fireEvent.press(getByTestId('selling-panel-onSale-retry'));

      expect(retryNextPage).toHaveBeenCalled();
    });

    it('당겨서 새로고침하면 해당 탭 목록을 처음부터 다시 받는다', () => {
      setSellingPosts([makePost(1)]);

      const { getByTestId } = renderWithProviders(<SellingPageView />);

      act(() => {
        getByTestId('selling-panel-sold').props.refreshControl.props.onRefresh();
      });

      expect(refetch).toHaveBeenCalled();
    });
  });

  it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
    setSellingPosts([], { posts: [], error: new Error('게시물 오류'), isError: true });

    renderWithProviders(<SellingPageView />);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
    );
  });
});
