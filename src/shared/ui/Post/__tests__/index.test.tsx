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

  it('이미지가 한 개이면 +N 뱃지를 표시하지 않는다', () => {
    const imageUrls = [{ imageId: 1, imageUrl: 'https://example.com/1.jpg' }];
    const { queryByText } = render(<Post {...makePost({ imageUrls })} />);

    expect(queryByText(/^\+\d+/)).toBeNull();
  });
});
