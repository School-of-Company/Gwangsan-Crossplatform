import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Post from '../index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-image', () => {
  const MockImage = ({ testID }: any) => {
    const { View } = require('react-native');
    return <View testID={testID} />;
  };
  MockImage.prefetch = jest.fn();
  return { Image: MockImage };
});

const makePost = (overrides = {}) => ({
  id: 1,
  title: '테스트 게시글',
  gwangsan: 3,
  type: 'OBJECT' as const,
  mode: 'GIVER' as const,
  content: '내용',
  isCompletable: true,
  isCompleted: false,
  isReserved: false,
  imageUrls: [],
  images: [],
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('Post', () => {
  it('제목과 광산 번호를 렌더링한다', () => {
    const { getByText } = render(<Post {...makePost()} />);

    expect(getByText('테스트 게시글')).toBeTruthy();
    expect(getByText('3 광산')).toBeTruthy();
  });

  it('누르면 /post/:id 경로로 이동한다', () => {
    const { getByText } = render(<Post {...makePost({ id: 5 })} />);

    fireEvent.press(getByText('테스트 게시글'));

    expect(mockPush).toHaveBeenCalledWith('/post/5');
  });

  it('id가 0 미만이면 누를 때 이동하지 않는다', () => {
    const { getByText } = render(<Post {...makePost({ id: -1 })} />);

    fireEvent.press(getByText('테스트 게시글'));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('임시 게시글(id < 0)에는 "업로드 중..." 텍스트를 표시한다', () => {
    const { getByText } = render(<Post {...makePost({ id: -1 })} />);

    expect(getByText('업로드 중...')).toBeTruthy();
  });

  it('일반 게시글에는 "업로드 중..." 텍스트가 없다', () => {
    const { queryByText } = render(<Post {...makePost()} />);

    expect(queryByText('업로드 중...')).toBeNull();
  });

  it('이미지가 여러 개이면 +N 뱃지를 표시한다', () => {
    const imageUrls = [
      { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
      { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
      { imageId: 3, imageUrl: 'https://example.com/3.jpg' },
    ];
    const { getByText } = render(<Post {...makePost({ imageUrls })} />);

    expect(getByText('+2')).toBeTruthy();
  });

  it('isReserved가 true이면 예약중 태그를 표시한다', () => {
    const { getByTestId } = render(<Post {...makePost({ isReserved: true })} />);

    expect(getByTestId('post-reserved-tag')).toBeTruthy();
  });

  it('isReserved가 false이면 예약중 태그를 표시하지 않는다', () => {
    const { queryByTestId } = render(<Post {...makePost({ isReserved: false })} />);

    expect(queryByTestId('post-reserved-tag')).toBeNull();
  });

  it('이미지가 한 개이면 +N 뱃지를 표시하지 않는다', () => {
    const imageUrls = [{ imageId: 1, imageUrl: 'https://example.com/1.jpg' }];
    const { queryByText } = render(<Post {...makePost({ imageUrls })} />);

    expect(queryByText(/^\+\d+/)).toBeNull();
  });

  it('seller가 있으면 판매자 닉네임을 표시한다', () => {
    const seller = { memberId: 1, nickname: '홍길동' };
    const { getByTestId } = render(<Post {...makePost({ seller })} />);

    expect(getByTestId('post-seller')).toHaveTextContent('판매자: 홍길동');
  });

  it('seller가 없으면 판매자 정보를 표시하지 않는다', () => {
    const { queryByTestId } = render(<Post {...makePost()} />);

    expect(queryByTestId('post-seller')).toBeNull();
  });

  it('buyer가 있으면 구매자 닉네임을 표시한다', () => {
    const buyer = { memberId: 2, nickname: '김철수' };
    const { getByTestId } = render(<Post {...makePost({ buyer })} />);

    expect(getByTestId('post-buyer')).toHaveTextContent('구매자: 김철수');
  });

  it('buyer가 없으면 구매자 정보를 표시하지 않는다', () => {
    const { queryByTestId } = render(<Post {...makePost()} />);

    expect(queryByTestId('post-buyer')).toBeNull();
  });
});
