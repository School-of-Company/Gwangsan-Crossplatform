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

  it('imageUrls가 있으면 각 이미지를 렌더링한다', () => {
    const review = makeReview({
      imageUrls: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
      ],
    });
    const { UNSAFE_getAllByType } = render(<ReviewPost review={review} />);
    const Image = require('react-native').Image;

    expect(UNSAFE_getAllByType(Image)).toHaveLength(2);
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

  it('images가 있으면 각 이미지를 렌더링한다', () => {
    const review = makeReview({
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.jpg' },
        { imageId: 2, imageUrl: 'https://example.com/2.jpg' },
      ],
    });
    const { UNSAFE_getAllByType } = render(<ReviewPost review={review} />);
    const Image = require('react-native').Image;

    const images = UNSAFE_getAllByType(Image);
    expect(images).toHaveLength(2);
  });

  it('클릭 시 cancelTrade 페이지로 이동한다', () => {
    const review = makeReview({ reviewId: '42' });
    const { getByText } = render(<ReviewPost review={review} />);

    fireEvent.press(getByText('작성자 홍길동'));

    expect(mockPush).toHaveBeenCalledWith('/cancelTrade/42');
  });
});
