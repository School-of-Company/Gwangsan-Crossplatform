import { instance } from '~/shared/lib/axios';
import { getMyPosts } from '../getMyPosts';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getMyPosts', () => {
  it('GET /post/current 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1, title: '내 게시글' }] });

    const result = await getMyPosts();

    expect(mockGet).toHaveBeenCalledWith('/post/current');
    expect(result).toEqual([{ id: 1, title: '내 게시글' }]);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Unauthorized'));

    await expect(getMyPosts()).rejects.toThrow('Unauthorized');
  });
});
