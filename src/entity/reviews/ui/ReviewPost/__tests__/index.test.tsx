import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ReviewPost from '../index';
import { ReviewPostType } from '~/view/reviews/model/reviewPostType';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.Mock;
const mockPush = jest.fn();

const makeReview = (overrides: Partial<ReviewPostType> = {}): ReviewPostType => ({
  reviewerName: '홍길동',
  content: '좋은 거래였습니다.',
  light: 50,
  productId: 1,
  images: [],
  reviewId: '10',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
});

describe('ReviewPost', () => {
  it('리뷰어 이름과 내용을 렌더링한다', () => {
    const review = makeReview();
    const { getByText } = render(<ReviewPost review={review} />);

    expect(getByText('작성자 홍길동')).toBeTruthy();
    expect(getByText('좋은 거래였습니다.')).toBeTruthy();
  });

  it('images가 없으면 기본 이미지를 렌더링한다', () => {
    const review = makeReview({ images: [] });
    const { UNSAFE_getAllByType } = render(<ReviewPost review={review} />);
    const Image = require('react-native').Image;

    const images = UNSAFE_getAllByType(Image);
    expect(images).toHaveLength(1);
  });

  it('imageUrls가 여러 장이어도 대표 이미지 한 장만 렌더링한다', () => {
    const review = makeReview({
      imageUrls: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
      ],
    });
    const { UNSAFE_getAllByType } = render(<ReviewPost review={review} />);
    const Image = require('react-native').Image;

    const images = UNSAFE_getAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.source).toEqual({ uri: 'https://example.com/1.jpg' });
  });

  it('사진이 여러 장이면 나머지 장수를 +N 배지로 표시한다', () => {
    const review = makeReview({
      imageUrls: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
        { imageId: 3, imageUrl: 'https://example.com/3.jpg' },
      ],
    });
    const { getByTestId, getByText } = render(<ReviewPost review={review} />);

    expect(getByTestId('review-post-hidden-image-count')).toBeTruthy();
    expect(getByText('+2')).toBeTruthy();
  });

  it('사진이 한 장이면 +N 배지를 표시하지 않는다', () => {
    const review = makeReview({
      imageUrls: [{ imageId: 1, imageUrl: 'https://example.com/1.jpg' }],
    });
    const { queryByTestId } = render(<ReviewPost review={review} />);

    expect(queryByTestId('review-post-hidden-image-count')).toBeNull();
  });

  it('사진이 여러 장이어도 밝기 게이지와 후기 본문이 함께 보인다', () => {
    const review = makeReview({
      content: '사진 많은 후기입니다.',
      imageUrls: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
        { imageId: 3, imageUrl: 'https://example.com/3.jpg' },
        { imageId: 4, imageUrl: 'https://example.com/4.jpg' },
      ],
    });
    const { getByText } = render(<ReviewPost review={review} />);

    expect(getByText('사진 많은 후기입니다.')).toBeTruthy();
    expect(getByText('작성자 홍길동')).toBeTruthy();
  });

  it('mode="toss"면 작성자 이름 대신 내가 작성한 후기임을 표시한다', () => {
    const review = makeReview();
    const { queryByText, getByText } = render(<ReviewPost review={review} mode="toss" />);

    expect(queryByText('작성자 홍길동')).toBeNull();
    expect(getByText('내가 작성한 후기')).toBeTruthy();
    expect(getByText('좋은 거래였습니다.')).toBeTruthy();
  });

  it('mode="toss"이고 targetName이 있으면 받은 사람을 표시한다', () => {
    const review = makeReview({ targetName: '김민하' });
    const { getByText, queryByText } = render(<ReviewPost review={review} mode="toss" />);

    expect(getByText('받은 사람 김민하')).toBeTruthy();
    expect(queryByText('내가 작성한 후기')).toBeNull();
  });

  it('mode="receive"면 작성자 이름을 표시한다', () => {
    const review = makeReview();
    const { getByText, queryByText } = render(<ReviewPost review={review} mode="receive" />);

    expect(getByText('작성자 홍길동')).toBeTruthy();
    expect(queryByText('내가 작성한 후기')).toBeNull();
  });

  it('구버전 응답의 images 필드로도 대표 이미지와 +N 배지를 렌더링한다', () => {
    const review = makeReview({
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
      ],
    });
    const { UNSAFE_getAllByType, getByText } = render(<ReviewPost review={review} />);
    const Image = require('react-native').Image;

    const images = UNSAFE_getAllByType(Image);
    expect(images).toHaveLength(1);
    expect(getByText('+1')).toBeTruthy();
  });

  it('클릭 시 cancelTrade 페이지로 이동한다', () => {
    const review = makeReview({ reviewId: '42' });
    const { getByText } = render(<ReviewPost review={review} />);

    fireEvent.press(getByText('작성자 홍길동'));

    expect(mockPush).toHaveBeenCalledWith('/cancelTrade/42');
  });
});
