import { getNoticeList } from '../getNoticeList';
import { instance } from '~/shared/lib/axios';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

describe('getNoticeList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /notice 호출 후 데이터를 반환한다', async () => {
    const list = [
      { id: 1, title: '공지1', content: '내용1', images: [] },
      { id: 2, title: '공지2', content: '내용2', images: [] },
    ];
    mockGet.mockResolvedValue({ data: list });

    const result = await getNoticeList();

    expect(mockGet).toHaveBeenCalledWith('/notice');
    expect(result).toEqual(list);
  });

  it('빈 배열을 반환할 수 있다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    const result = await getNoticeList();

    expect(result).toEqual([]);
  });

  it('API 실패 시 에러를 그대로 던진다', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getNoticeList()).rejects.toThrow('Network error');
  });

  it('이미지가 포함된 공지 목록을 반환한다', async () => {
    const list = [
      {
        id: 1,
        title: '이미지 공지',
        content: '내용',
        images: [{ imageId: 1, imageUrl: 'https://example.com/img.png' }],
      },
    ];
    mockGet.mockResolvedValue({ data: list });

    const result = await getNoticeList();

    expect(result[0].images).toHaveLength(1);
    expect(result[0].images[0].imageUrl).toBe('https://example.com/img.png');
  });
});
