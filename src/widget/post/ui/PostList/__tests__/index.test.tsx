import React from 'react';
import { render, act } from '@testing-library/react-native';
import PostList from '../index';
import { useGetPosts } from '~/shared/model/useGetPosts';

jest.mock('~/shared/model/useGetPosts', () => ({
  useGetPosts: jest.fn(),
}));

jest.mock('scrolloop/native', () => ({
  VirtualList: ({ count, renderItem, refreshControl }: any) => {
    const { View } = require('react-native');
    const { cloneElement } = require('react');
    const items = Array.from({ length: count }, (_, i) => cloneElement(renderItem(i), { key: i }));
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

beforeEach(() => jest.clearAllMocks());

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
});
