import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CompletedTrades from '../index';
import type { PostType } from '~/shared/types/postType';

jest.mock('~/shared/ui/Post', () => ({
  __esModule: true,
  default: ({ id, title }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`post-${id}`}>{title}</Text>;
  },
}));

jest.mock('~/shared/ui', () => ({
  PillTabs: ({ tabs, value, onChange, testIDPrefix }: any) => {
    const { Text, TouchableOpacity, View } = require('react-native');
    return (
      <View>
        {tabs.map((tab: any) => (
          <TouchableOpacity
            key={tab.value}
            testID={`${testIDPrefix}-${tab.value}`}
            onPress={() => onChange(tab.value)}>
            <Text>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

const makePost = (overrides: Partial<PostType> = {}): PostType => ({
  id: 1,
  type: 'OBJECT' as const,
  mode: 'RECEIVER' as const,
  title: '완료된 품목',
  content: '내용',
  gwangsan: 3,
  isCompletable: true,
  isCompleted: true,
  isReserved: false,
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

  it('"구매 내역"/"판매 내역" 탭을 표시하고, 기본으로 구매 내역 탭이 선택된다', () => {
    const posts = [
      makePost({ id: 1, title: '구매한 품목', mode: 'RECEIVER', isCompleted: true }),
      makePost({ id: 2, title: '판매한 품목', mode: 'GIVER', isCompleted: true }),
    ];

    const { getByText, getByTestId, queryByTestId } = render(
      <CompletedTrades posts={posts} isMe />
    );

    expect(getByText('구매 내역')).toBeTruthy();
    expect(getByText('판매 내역')).toBeTruthy();
    expect(getByTestId('post-1')).toBeTruthy();
    expect(queryByTestId('post-2')).toBeNull();
  });

  it('"판매 내역" 탭을 누르면 GIVER 모드의 완료 품목만 보여준다', () => {
    const posts = [
      makePost({ id: 1, title: '구매한 품목', mode: 'RECEIVER', isCompleted: true }),
      makePost({ id: 2, title: '판매한 품목', mode: 'GIVER', isCompleted: true }),
    ];

    const { getByTestId, queryByTestId } = render(<CompletedTrades posts={posts} isMe />);

    fireEvent.press(getByTestId('trade-history-tab-GIVER'));

    expect(getByTestId('post-2')).toBeTruthy();
    expect(queryByTestId('post-1')).toBeNull();
  });

  it('진행중인 품목은 현재 탭이어도 표시하지 않는다', () => {
    const posts = [
      makePost({ id: 1, title: '완료됨', mode: 'RECEIVER', isCompleted: true }),
      makePost({ id: 2, title: '진행중', mode: 'RECEIVER', isCompleted: false }),
    ];

    const { getByTestId, queryByTestId } = render(<CompletedTrades posts={posts} isMe />);

    expect(getByTestId('post-1')).toBeTruthy();
    expect(queryByTestId('post-2')).toBeNull();
  });

  it('구매한 품목이 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<CompletedTrades posts={[]} isMe />);

    expect(getByText('구매한 품목이 없습니다.')).toBeTruthy();
  });

  it('판매 내역 탭에서 판매한 품목이 없으면 안내 문구를 표시한다', () => {
    const { getByTestId, getByText } = render(<CompletedTrades posts={[]} isMe />);

    fireEvent.press(getByTestId('trade-history-tab-GIVER'));

    expect(getByText('판매한 품목이 없습니다.')).toBeTruthy();
  });

  it('posts가 없으면 안내 문구를 표시한다', () => {
    const { getByText } = render(<CompletedTrades isMe />);

    expect(getByText('구매한 품목이 없습니다.')).toBeTruthy();
  });
});
