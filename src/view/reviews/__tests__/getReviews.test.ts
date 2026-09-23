import { instance } from '~/shared/lib/axios';
import { getMyReceivedReview, getReceiveReview, getTossReview } from '../api/getReviews';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('~/shared/lib/errorHandler', () => ({
  getErrorMessage: jest.fn((e: unknown) => (e instanceof Error ? e.message : '알 수 없는 오류')),
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getReceiveReview', () => {
  it('GET /review/:id 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '1', content: '후기' }];
    mockGet.mockResolvedValue({ data: reviews });

    const result = await getReceiveReview('3');

    expect(mockGet).toHaveBeenCalledWith('/review/3');
    expect(result).toEqual(reviews);
  });

  it('params가 있으면 size/cursor를 쿼리 파라미터로 전달한다', async () => {
    const reviews = [{ reviewId: '1', content: '후기' }];
    mockGet.mockResolvedValue({ data: reviews });

    await getReceiveReview('3', { size: 20, cursor: 100 });

    expect(mockGet).toHaveBeenCalledWith('/review/3', { params: { size: 20, cursor: 100 } });
  });

  it('cursor 없이 size만 있으면(첫 페이지) cursor를 보내지 않는다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getReceiveReview('3', { size: 20 });

    expect(mockGet).toHaveBeenCalledWith('/review/3', { params: { size: 20 } });
  });

  it('API 실패 시 getErrorMessage로 변환된 에러를 던진다', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));

    await expect(getReceiveReview('3')).rejects.toThrow('Server error');
  });
});

describe('getMyReceivedReview', () => {
  it('GET /review/current 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '5', content: '내가 받은 후기' }];
    mockGet.mockResolvedValue({ data: reviews });

    const result = await getMyReceivedReview();

    expect(mockGet).toHaveBeenCalledWith('/review/current');
    expect(result).toEqual(reviews);
  });

  it('params가 있으면 size/cursor를 쿼리 파라미터로 전달한다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getMyReceivedReview({ size: 20, cursor: 50 });

    expect(mockGet).toHaveBeenCalledWith('/review/current', { params: { size: 20, cursor: 50 } });
  });

  it('API 실패 시 getErrorMessage로 변환된 에러를 던진다', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));

    await expect(getMyReceivedReview()).rejects.toThrow('Server error');
  });
});

describe('getTossReview', () => {
  it('GET /review 응답 data를 반환한다', async () => {
    const reviews = [{ reviewId: '2', content: '내가 준 후기' }];
    mockGet.mockResolvedValue({ data: reviews });

    const result = await getTossReview();

    expect(mockGet).toHaveBeenCalledWith('/review');
    expect(result).toEqual(reviews);
  });

  it('API 실패 시 getErrorMessage로 변환된 에러를 던진다', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getTossReview()).rejects.toThrow('Network error');
  });
});
