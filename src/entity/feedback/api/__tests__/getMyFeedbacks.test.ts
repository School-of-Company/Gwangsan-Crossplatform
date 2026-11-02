import { getMyFeedback, getMyFeedbacks } from '../getMyFeedbacks';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

const makeFeedback = (feedbackId: number) => ({
  feedbackId,
  type: 'BUG',
  content: `문의 ${feedbackId}`,
  images: [],
  status: 'RECEIVED',
  answer: null,
  answeredAt: null,
  createdAt: '2026-11-01T10:00:00',
});

beforeEach(() => jest.clearAllMocks());

describe('getMyFeedbacks', () => {
  it('첫 페이지는 last_id 없이 size만 보낸다', async () => {
    mockGet.mockResolvedValue({ data: [makeFeedback(3)] });

    const result = await getMyFeedbacks();

    expect(mockGet).toHaveBeenCalledWith('/feedback/me', { params: { size: 20 } });
    expect(result).toEqual([makeFeedback(3)]);
  });

  it('lastId가 있으면 last_id로 보낸다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getMyFeedbacks({ lastId: 7, size: 5 });

    expect(mockGet).toHaveBeenCalledWith('/feedback/me', { params: { size: 5, last_id: 7 } });
  });

  it('배열이 아닌 응답은 빈 배열로 바꾼다', async () => {
    mockGet.mockResolvedValue({ data: null });

    await expect(getMyFeedbacks()).resolves.toEqual([]);
  });

  it('요청이 실패하면 에러를 던진다', async () => {
    mockGet.mockRejectedValue(new Error('조회 실패'));

    await expect(getMyFeedbacks()).rejects.toThrow('조회 실패');
  });
});

describe('getMyFeedback', () => {
  it('last_id = id + 1, size = 1로 한 건을 조회한다', async () => {
    mockGet.mockResolvedValue({ data: [makeFeedback(5)] });

    const result = await getMyFeedback(5);

    expect(mockGet).toHaveBeenCalledWith('/feedback/me', { params: { size: 1, last_id: 6 } });
    expect(result).toEqual(makeFeedback(5));
  });

  it('다른 id가 오면(내 문의가 아니거나 없음) null을 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [makeFeedback(4)] });

    await expect(getMyFeedback(5)).resolves.toBeNull();
  });

  it('빈 배열이면 null을 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await expect(getMyFeedback(5)).resolves.toBeNull();
  });
});
