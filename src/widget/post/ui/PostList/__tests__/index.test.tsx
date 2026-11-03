import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import PostList from '../index';
import { useGetPosts } from '~/entity/post/model/useGetPosts';
import { useGetBlockList } from '~/entity/profile/model/useGetBlockList';

jest.mock('~/entity/post/model/useGetPosts', () => ({
  useGetPosts: jest.fn(),
}));

jest.mock('~/entity/profile/model/useGetBlockList', () => ({
  useGetBlockList: jest.fn(),
}));

const mockVirtualListProps = jest.fn();

jest.mock('scrolloop/native', () => ({
  VirtualList: (props: any) => {
    const { count, renderItem, refreshControl, itemSize } = props;
    mockVirtualListProps(props);
    const { View } = require('react-native');
    const { cloneElement } = require('react');
    const items = Array.from({ length: count }, (_, i) => {
      const el = renderItem(i, { position: 'absolute', top: i * itemSize, height: itemSize });
      return el ? cloneElement(el, { key: i }) : null;
    });
    return (
      <View>
        {refreshControl}
        {items}
      </View>
    );
  },
}));

jest.mock('~/shared/ui/Post', () => {
  const { Text } = require('react-native');
  return ({ title }: any) => <Text>{title}</Text>;
});

const mockUseGetPosts = useGetPosts as jest.Mock;
const mockUseGetBlockList = useGetBlockList as jest.Mock;

const makePosts = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `게시글 ${i + 1}`,
    gwangsan: 1,
    type: 'OBJECT' as const,
    mode: 'GIVER' as const,
    content: '내용',
    isCompletable: true,
    isCompleted: false,
    imageUrls: [],
  }));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseGetBlockList.mockReturnValue({ data: [] });
});

describe('PostList', () => {
  it('게시물이 없으면 빈 상태 메시지를 표시한다', () => {
    mockUseGetPosts.mockReturnValue({ data: [], refetch: jest.fn() });

    const { getByText } = render(<PostList category="팔아요" type="OBJECT" />);

    expect(getByText('게시물이 없습니다.')).toBeTruthy();
  });

  it('게시물이 있으면 목록을 렌더링한다', () => {
    mockUseGetPosts.mockReturnValue({ data: makePosts(2), refetch: jest.fn() });

    const { getByText } = render(<PostList category="팔아요" type="OBJECT" />);

    expect(getByText('게시글 1')).toBeTruthy();
    expect(getByText('게시글 2')).toBeTruthy();
  });

  it('category가 "팔아요"이면 GIVER 모드로 useGetPosts를 호출한다', () => {
    mockUseGetPosts.mockReturnValue({ data: [], refetch: jest.fn() });

    render(<PostList category="팔아요" type="OBJECT" />);

    expect(mockUseGetPosts).toHaveBeenCalledWith('GIVER', 'OBJECT');
  });

  it('category가 "필요해요"이면 RECEIVER 모드로 useGetPosts를 호출한다', () => {
    mockUseGetPosts.mockReturnValue({ data: [], refetch: jest.fn() });

    render(<PostList category="필요해요" type="OBJECT" />);

    expect(mockUseGetPosts).toHaveBeenCalledWith('RECEIVER', 'OBJECT');
  });

  it('새로고침 시 refetch를 호출하고 refreshing이 false로 돌아온다', async () => {
    const mockRefetch = jest.fn().mockResolvedValue({});
    mockUseGetPosts.mockReturnValue({ data: makePosts(1), refetch: mockRefetch });

    const { UNSAFE_getByType } = render(<PostList category="팔아요" type="OBJECT" />);

    const { RefreshControl } = require('react-native');
    const refreshControl = UNSAFE_getByType(RefreshControl);

    await act(async () => {
      await refreshControl.props.onRefresh();
    });

    expect(mockRefetch).toHaveBeenCalled();
    expect(refreshControl.props.refreshing).toBe(false);
  });

  it('category가 빈 문자열이면 currentMode 없이 useGetPosts를 호출한다', () => {
    mockUseGetPosts.mockReturnValue({ data: [], refetch: jest.fn() });

    render(<PostList category={'' as any} type="OBJECT" />);

    expect(mockUseGetPosts).toHaveBeenCalledWith(undefined, 'OBJECT');
  });

  it('useGetPosts가 data를 반환하지 않으면 빈 배열을 기본값으로 사용한다', () => {
    mockUseGetPosts.mockReturnValue({ data: undefined, refetch: jest.fn() });

    const { getByText } = render(<PostList category="팔아요" type="OBJECT" />);

    expect(getByText('게시물이 없습니다.')).toBeTruthy();
  });

  describe('목록 높이와 스크롤', () => {
    const lastListProps = () => mockVirtualListProps.mock.calls.at(-1)?.[0];

    it('목록 영역의 실제 높이를 재서 VirtualList height로 넘긴다', () => {
      mockUseGetPosts.mockReturnValue({ data: makePosts(), refetch: jest.fn() });
      const { getByTestId } = render(<PostList category="팔아요" type="OBJECT" />);

      fireEvent(getByTestId('post-list'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 712 } },
      });

      expect(lastListProps().height).toBe(712);
    });

    it('높이를 재기 전에도 목록을 그린다', () => {
      mockUseGetPosts.mockReturnValue({ data: makePosts(), refetch: jest.fn() });
      const { getByText } = render(<PostList category="팔아요" type="OBJECT" />);

      expect(getByText('게시글 1')).toBeTruthy();
      expect(lastListProps().height).toBeGreaterThan(0);
    });

    it('관성 스크롤을 막지 않는다', () => {
      mockUseGetPosts.mockReturnValue({ data: makePosts(), refetch: jest.fn() });
      render(<PostList category="팔아요" type="OBJECT" />);

      expect(lastListProps().decelerationRate).toBeUndefined();
    });

    it('VirtualList가 넘긴 위치·높이 style로 카드를 배치한다', () => {
      mockUseGetPosts.mockReturnValue({ data: makePosts(2), refetch: jest.fn() });
      const { getByTestId } = render(<PostList category="팔아요" type="OBJECT" />);

      const itemSize = lastListProps().itemSize;
      expect(getByTestId('post-list-item-1').props.style).toEqual({
        position: 'absolute',
        top: itemSize,
        height: itemSize,
      });
    });
  });

  it('data 배열에 항목이 없는 인덱스가 있으면 renderItem이 null을 반환한다', () => {
    const posts = makePosts(1);
    mockUseGetPosts.mockReturnValue({
      data: [posts[0], undefined],
      refetch: jest.fn(),
    });

    const { getByText, queryByText } = render(<PostList category="팔아요" type="OBJECT" />);

    expect(getByText('게시글 1')).toBeTruthy();
    expect(queryByText('게시글 2')).toBeNull();
  });

  it('차단한 사용자의 게시물은 목록에서 제외한다', () => {
    const posts = makePosts(2).map((post, i) => ({
      ...post,
      member: { memberId: i + 1, nickname: `유저${i + 1}`, placeName: '', light: 1 },
    }));
    mockUseGetPosts.mockReturnValue({ data: posts, refetch: jest.fn() });
    mockUseGetBlockList.mockReturnValue({ data: [{ memberId: 1, nickname: '유저1' }] });

    const { getByText, queryByText } = render(<PostList category="팔아요" type="OBJECT" />);

    expect(queryByText('게시글 1')).toBeNull();
    expect(getByText('게시글 2')).toBeTruthy();
  });

  describe('로딩·실패 상태(#740)', () => {
    it('게시물 조회에 실패하면 빈 목록 대신 다시 시도 화면을 보여준다', () => {
      const refetch = jest.fn();
      mockUseGetPosts.mockReturnValue({ data: undefined, isError: true, refetch });

      const { getByText, queryByText } = render(<PostList category={'' as any} type="OBJECT" />);

      expect(queryByText('게시물이 없습니다.')).toBeNull();
      fireEvent.press(getByText('다시 시도'));
      expect(refetch).toHaveBeenCalled();
    });

    it('차단 목록을 불러오지 못하면 걸러내지 않은 목록 대신 다시 시도 화면을 보여준다', () => {
      const refetchBlockList = jest.fn();
      mockUseGetPosts.mockReturnValue({ data: makePosts(2), refetch: jest.fn() });
      mockUseGetBlockList.mockReturnValue({
        data: undefined,
        isError: true,
        refetch: refetchBlockList,
      });

      const { getByText } = render(<PostList category={'' as any} type="OBJECT" />);

      fireEvent.press(getByText('다시 시도'));
      expect(refetchBlockList).toHaveBeenCalled();
    });

    it('처음 불러오는 중에는 빈 목록 문구 대신 로딩 표시를 보여준다', () => {
      mockUseGetPosts.mockReturnValue({ data: undefined, isLoading: true, refetch: jest.fn() });

      const { getByTestId, queryByText } = render(<PostList category={'' as any} type="OBJECT" />);

      expect(getByTestId('post-list-loading')).toBeTruthy();
      expect(queryByText('게시물이 없습니다.')).toBeNull();
    });

    it('받아둔 목록이 있으면 새로 조회하다 실패해도 목록을 유지한다', () => {
      mockUseGetPosts.mockReturnValue({ data: makePosts(1), isError: true, refetch: jest.fn() });

      const { queryByText } = render(<PostList category={'' as any} type="OBJECT" />);

      expect(queryByText('다시 시도')).toBeNull();
    });
  });
});
