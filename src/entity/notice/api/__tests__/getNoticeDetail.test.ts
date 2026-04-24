import { getNoticeDetail } from '../getNoticeDetail';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

const makeNotice = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: '공지사항',
  content: '공지 내용입니다.',
  place: '광산구청',
  createdAt: '2025-01-15',
  role: 'ROLE_PLACE_ADMIN',
  images: [],
  ...overrides,
});

describe('getNoticeDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /notice/:id 호출 후 데이터를 반환한다', async () => {
    const notice = makeNotice();
    mockGet.mockResolvedValue({ data: notice });

    const result = await getNoticeDetail(1);

    expect(mockGet).toHaveBeenCalledWith('/notice/1');
    expect(result).toEqual(notice);
  });

  it('이미지가 여러 개인 공지를 반환한다', async () => {
    const notice = makeNotice({
      images: [
        { imageId: 1, imageUrl: 'https://example.com/1.png' },
        { imageId: 2, imageUrl: 'https://example.com/2.png' },
      ],
    });
    mockGet.mockResolvedValue({ data: notice });

    const result = await getNoticeDetail(1);

    expect(result.images).toHaveLength(2);
  });

  it('place, createdAt이 빈 문자열인 경우도 처리한다', async () => {
    const notice = makeNotice({ place: '', createdAt: '' });
    mockGet.mockResolvedValue({ data: notice });

    const result = await getNoticeDetail(1);

    expect(result.place).toBe('');
    expect(result.createdAt).toBe('');
  });

  it('API 실패 시 에러를 그대로 던진다', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));

    await expect(getNoticeDetail(1)).rejects.toThrow('Server error');
  });

  it('noticeId가 큰 숫자여도 올바르게 호출한다', async () => {
    mockGet.mockResolvedValue({ data: makeNotice({ id: 99999 }) });

    await getNoticeDetail(99999);

    expect(mockGet).toHaveBeenCalledWith('/notice/99999');
  });
});
