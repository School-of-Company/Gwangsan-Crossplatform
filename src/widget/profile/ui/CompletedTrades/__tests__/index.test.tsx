import React from 'react';
import { render } from '@testing-library/react-native';
import CompletedTrades from '../index';
import type { PostType } from '~/shared/types/postType';

jest.mock('~/shared/ui/Post', () => ({
  __esModule: true,
  default: ({ id, title }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`post-${id}`}>{title}</Text>;
  },
}));

const makePost = (overrides: Partial<PostType> = {}): PostType => ({
  id: 1,
  type: 'OBJECT' as const,
  mode: 'GIVER' as const,
  title: '완료된 품목',
  content: '내용',
  gwangsan: 3,
  isCompletable: true,
  isCompleted: true,
  imageUrls: [],
  images: [],
  ...overrides,
});

describe('CompletedTrades', () => {
  it('isMe=true이면 "거래 완료 품목" 타이틀을 표시한다', () => {
    const { getByText } = render(<CompletedTrades posts={[]} isMe />);

    expect(getByText('거래 완료 품목')).toBeTruthy();
  });

  it('isMe=false이면 상대방 이름이 포함된 타이틀을 표시한다', () => {
    const { getByText } = render(<CompletedTrades posts={[]} isMe={false} name="홍길동" />);

    expect(getByText('홍길동님의 거래 완료 품목')).toBeTruthy();
  });

  it('거래완료 상태인 품목만 필터링해서 렌더링한다', () => {
    const posts = [
      makePost({ id: 1, title: '완료됨', isCompleted: true }),
      makePost({ id: 2, title: '진행중', isCompleted: false }),
    ];

    const { getByTestId, queryByTestId } = render(<CompletedTrades posts={posts} isMe />);

    expect(getByTestId('post-1')).toBeTruthy();
    expect(queryByTestId('post-2')).toBeNull();
  });

  it('거래완료 품목이 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<CompletedTrades posts={[]} isMe />);

    expect(getByText('거래 완료된 품목이 없습니다.')).toBeTruthy();
  });

  it('posts가 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<CompletedTrades isMe />);

    expect(getByText('거래 완료된 품목이 없습니다.')).toBeTruthy();
  });
});
