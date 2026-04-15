import { instance } from '~/shared/lib/axios';
import { getReview } from '../getReview';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getReview', () => {
  it('GET /review/detail/:id 응답 data를 반환한다', async () => {
    const reviewData = { review_id: 1, title: '좋아요', content: '만족', light: 80, imageUrls: [] };
    mockGet.mockResolvedValue({ data: reviewData });

    const result = await getReview('1');

    expect(mockGet).toHaveBeenCalledWith('/review/detail/1');
    expect(result).toEqual(reviewData);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getReview('999')).rejects.toThrow('Not found');
  });
});
