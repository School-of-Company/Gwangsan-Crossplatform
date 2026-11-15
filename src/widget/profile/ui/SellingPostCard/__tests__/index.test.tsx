import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { resetNavigationLock } from '~/shared/lib/navigationGuard';
import type { PostType } from '~/shared/types/postType';
import { SellingPostCard } from '../index';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('~/shared/ui/PostThumbnail', () => ({ PostThumbnail: () => null }));

const mockPush = jest.fn();

const makePost = (overrides: Partial<PostType> = {}): PostType => ({
  id: 5,
  type: 'OBJECT',
  mode: 'GIVER',
  title: '자전거',
  content: '내용',
  gwangsan: 30,
  isCompletable: true,
  isCompleted: false,
  isReserved: false,
  ...overrides,
});

const review = { reviewId: 77, productId: 5 } as never;

beforeEach(() => {
  jest.clearAllMocks();
  resetNavigationLock();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

describe('SellingPostCard', () => {
  it.each([
    ['OBJECT', 'GIVER', '물건을 팔아요'],
    ['OBJECT', 'RECEIVER', '물건이 필요해요'],
    ['SERVICE', 'GIVER', '서비스를 할 수 있어요'],
    ['SERVICE', 'RECEIVER', '서비스를 해주세요'],
  ] as const)('%s/%s 게시글은 "%s"로 표시한다', (type, mode, label) => {
    render(<SellingPostCard post={makePost({ type, mode })} onMenuPress={jest.fn()} />);

    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('30 광산')).toBeTruthy();
  });

  it('카드를 누르면 게시글 상세로 이동한다', () => {
    render(<SellingPostCard post={makePost()} onMenuPress={jest.fn()} />);

    fireEvent.press(screen.getByText('자전거'));

    expect(mockPush).toHaveBeenCalledWith('/post/5');
  });

  it('직전 이동 직후에 다시 눌러도 한 번만 이동한다', () => {
    render(<SellingPostCard post={makePost()} onMenuPress={jest.fn()} />);

    fireEvent.press(screen.getByText('자전거'));
    fireEvent.press(screen.getByText('자전거'));

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('임시 게시글(id < 0)은 눌러도 이동하지 않고 메뉴 버튼도 없다', () => {
    render(<SellingPostCard post={makePost({ id: -1 })} onMenuPress={jest.fn()} />);

    fireEvent.press(screen.getByText('자전거'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByTestId('selling-card-menu--1')).toBeNull();
  });

  it('메뉴 버튼을 누르면 해당 게시글로 onMenuPress를 호출한다', () => {
    const onMenuPress = jest.fn();
    const post = makePost();
    render(<SellingPostCard post={post} onMenuPress={onMenuPress} />);

    fireEvent.press(screen.getByTestId('selling-card-menu-5'));

    expect(onMenuPress).toHaveBeenCalledWith(post);
  });

  describe('거래 완료', () => {
    const completed = makePost({ isCompleted: true, buyer: { nickname: '구매자A' } as never });

    it('구매자 닉네임을 표시하고 메뉴 버튼은 숨긴다', () => {
      render(<SellingPostCard post={completed} onMenuPress={jest.fn()} />);

      expect(screen.getByText('구매자 구매자A')).toBeTruthy();
      expect(screen.queryByTestId('selling-card-menu-5')).toBeNull();
    });

    it('받은 후기가 있으면 "받은 후기 보기"로 후기 상세에 이동한다', () => {
      render(
        <SellingPostCard post={completed} receivedReviews={[review]} onMenuPress={jest.fn()} />
      );

      fireEvent.press(screen.getByTestId('selling-card-reviews-5'));

      expect(mockPush).toHaveBeenCalledWith('/cancelTrade/77');
    });

    it('이 게시글의 후기가 아니면 후기 버튼을 표시하지 않는다', () => {
      render(
        <SellingPostCard
          post={completed}
          receivedReviews={[{ reviewId: 1, productId: 999 } as never]}
          onMenuPress={jest.fn()}
        />
      );

      expect(screen.queryByTestId('selling-card-reviews-5')).toBeNull();
    });

    it('후기를 불러오는 중에는 로딩 표시만 보여준다', () => {
      render(
        <SellingPostCard
          post={completed}
          receivedReviews={[review]}
          isReviewsLoading
          onMenuPress={jest.fn()}
        />
      );

      expect(screen.getByTestId('selling-card-reviews-loading-5')).toBeTruthy();
      expect(screen.queryByTestId('selling-card-reviews-5')).toBeNull();
    });

    it('임시 게시글에는 후기 영역을 표시하지 않는다', () => {
      render(
        <SellingPostCard
          post={{ ...completed, id: -2 }}
          receivedReviews={[{ reviewId: 1, productId: -2 } as never]}
          isReviewsLoading
          onMenuPress={jest.fn()}
        />
      );

      expect(screen.queryByTestId('selling-card-reviews-loading--2')).toBeNull();
    });
  });
});
