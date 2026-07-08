import { instance } from '~/shared/lib/axios';
import { getPost } from '../getPosts';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getPost', () => {
  it('GET /post/member/:id 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 2, title: '상대방 게시글' }] });

    const result = await getPost('5');

    expect(mockGet).toHaveBeenCalledWith('/post/member/5');
    expect(result).toEqual([{ id: 2, title: '상대방 게시글' }]);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getPost('999')).rejects.toThrow('Not found');
  });
});
