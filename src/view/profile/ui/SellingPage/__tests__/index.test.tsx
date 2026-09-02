import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { renderWithProviders } from '~/test-utils';
import SellingPageView from '../index';
import { useGetProfile } from '~/view/profile/model/useGetProfile';
import { useGetMyProfile } from '~/view/profile/model/useGetMyProfile';
import { useGetMyPosts } from '~/view/profile/model/useGetMyPosts';
import { useGetPosts } from '~/view/profile/model/useGetPosts';
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
const mockUseGetMyPosts = useGetMyPosts as jest.Mock;
const mockUseGetPosts = useGetPosts as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({});
  mockUseRouter.mockReturnValue({ push });
  mockUseGetProfile.mockReturnValue({ data: undefined, error: null, isError: false });
  mockUseGetMyProfile.mockReturnValue({ data: { memberId: 1, nickname: '나' } });
  mockUseGetMyPosts.mockReturnValue({ data: [], error: null, isError: false });
  mockUseGetPosts.mockReturnValue({ data: [], error: null, isError: false });
});

describe('SellingPageView', () => {
  it('본인 프로필일 때 "판매관리" 타이틀을 표시한다', () => {
    const { getByTestId } = renderWithProviders(<SellingPageView />);

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

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    expect(mockUseGetMyPosts).toHaveBeenCalledWith(false);
    expect(mockUseGetPosts).toHaveBeenCalledWith('5');

    const header = JSON.parse(getByTestId('header').props.children);
    expect(header.headerTitle).toBe('상대방님의 판매 목록');
  });

  it('기본 탭은 "판매중"이며, 게시물이 없으면 두 패널 모두 안내 문구를 표시한다', () => {
    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중(active)')).toBeTruthy();
    expect(getByText('판매 중인 게시물이 없습니다.')).toBeTruthy();
    expect(getByText('판매 완료된 게시물이 없습니다.')).toBeTruthy();
  });

  it('좌우로 나란히 배치된 두 패널에 각각 GIVER 게시물을 완료 여부로 나누어 렌더링하고 RECEIVER는 제외한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
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
      ],
      error: null,
      isError: false,
    });

    const { getByText, queryByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중글')).toBeTruthy();
    expect(getByText('판매완료글')).toBeTruthy();
    expect(queryByText('구매글')).toBeNull();
  });

  it('카드에 물품 이름, 물건/서비스·판매/구매 여부 문구, 광산 번호를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('판매중글')).toBeTruthy();
    expect(getByText('물건을 팔아요')).toBeTruthy();
    expect(getByText('3 광산')).toBeTruthy();
  });

  it('서비스 게시물이면 "서비스를 할 수 있어요" 문구를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '출장 세차',
          type: 'SERVICE',
          mode: 'GIVER',
          gwangsan: 7,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('서비스를 할 수 있어요')).toBeTruthy();
  });

  it('카드를 누르면 상세 페이지로 이동한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByText('판매중글'));

    expect(push).toHaveBeenCalledWith('/post/1');
  });

  it('점 3개 버튼을 누르면 게시글 수정/삭제하기/닫기 액션 시트가 뜬다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));

    expect(getByText('게시글 수정')).toBeTruthy();
    expect(getByText('삭제하기')).toBeTruthy();
    expect(getByText('닫기')).toBeTruthy();
  });

  it('"게시글 수정"을 누르면 글쓰기 수정 화면으로 이동하고 시트를 닫는다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('게시글 수정'));

    expect(push).toHaveBeenCalledWith('/write?id=1');
    expect(queryByText('게시글 수정')).toBeNull();
  });

  it('"삭제하기"를 누르면 확인 AlertModal을 띄우고, 확인 시 deletePost를 호출한다', async () => {
    (deletePost as jest.Mock).mockResolvedValue(undefined);
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

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

  it('삭제 확인 AlertModal에서 취소를 누르면 deletePost를 호출하지 않는다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('삭제하기'));
    fireEvent.press(getByTestId('delete-alert-cancel'));

    expect(deletePost).not.toHaveBeenCalled();
    expect(queryByText('이 게시글을 삭제하시겠습니까?')).toBeNull();
  });

  it('"닫기"를 누르면 액션 시트가 닫힌다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId, getByText, queryByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-menu-1'));
    fireEvent.press(getByText('닫기'));

    expect(queryByText('삭제하기')).toBeNull();
  });

  it('판매완료 카드에는 점 3개 메뉴가 없고 "받은 후기 보기" 버튼이 있다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 3,
          title: '판매완료글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 5,
          isCompleted: true,
        },
      ],
      error: null,
      isError: false,
    });

    const { queryByTestId, getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    expect(queryByTestId('selling-card-menu-3')).toBeNull();
    expect(getByTestId('selling-card-reviews-3')).toBeTruthy();
    expect(getByText('받은 후기 보기')).toBeTruthy();
  });

  it('판매완료 카드에 구매자 닉네임을 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 3,
          title: '판매완료글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 5,
          isCompleted: true,
          buyer: { memberId: 9, nickname: '홍길동' },
        },
      ],
      error: null,
      isError: false,
    });

    const { getByText } = renderWithProviders(<SellingPageView />);

    expect(getByText('구매자 홍길동')).toBeTruthy();
  });

  it('판매중 카드에는 구매자 닉네임을 표시하지 않는다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 1,
          title: '판매중글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 3,
          isCompleted: false,
          buyer: { memberId: 9, nickname: '홍길동' },
        },
      ],
      error: null,
      isError: false,
    });

    const { queryByText } = renderWithProviders(<SellingPageView />);

    expect(queryByText('구매자 홍길동')).toBeNull();
  });

  it('"받은 후기 보기"를 누르면 내 받은 후기 페이지로 이동한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: [
        {
          id: 3,
          title: '판매완료글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 5,
          isCompleted: true,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-reviews-3'));

    expect(push).toHaveBeenCalledWith('/reviews/1');
  });

  it('상대방 프로필의 판매완료 카드에서 "받은 후기 보기"를 누르면 상대방 후기 페이지로 이동한다', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: '5' });
    mockUseGetProfile.mockReturnValue({
      data: { nickname: '상대방', memberId: 5 },
      error: null,
      isError: false,
    });
    mockUseGetPosts.mockReturnValue({
      data: [
        {
          id: 3,
          title: '판매완료글',
          type: 'OBJECT',
          mode: 'GIVER',
          gwangsan: 5,
          isCompleted: true,
        },
      ],
      error: null,
      isError: false,
    });

    const { getByTestId } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-card-reviews-3'));

    expect(push).toHaveBeenCalledWith('/reviews/5');
  });

  it('"판매완료" 탭을 누르면 해당 탭이 활성화된다', () => {
    const { getByTestId, getByText } = renderWithProviders(<SellingPageView />);

    fireEvent.press(getByTestId('selling-tab-sold'));

    expect(getByText('판매완료(active)')).toBeTruthy();
  });

  it('게시물 조회 실패 시 에러 Toast를 표시한다', () => {
    mockUseGetMyPosts.mockReturnValue({
      data: undefined,
      error: new Error('게시물 오류'),
      isError: true,
    });

    renderWithProviders(<SellingPageView />);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', text1: '글을 불러오는데 실패했습니다.' })
    );
  });
});
