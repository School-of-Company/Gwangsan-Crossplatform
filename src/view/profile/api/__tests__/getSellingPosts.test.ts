import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { getSellingPosts, SELLING_PAGE_SIZE } from '../getSellingPosts';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getSellingPosts', () => {
  it('본인 목록은 /post/current를 mode=GIVER, 기본 size와 함께 조회한다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getSellingPosts({});

    expect(mockGet).toHaveBeenCalledWith('/post/current', {
      params: { mode: 'GIVER', size: SELLING_PAGE_SIZE },
    });
  });

  it('다른 회원 목록은 /post/member/{id}를 조회한다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getSellingPosts({ memberId: '5' });

    expect(mockGet).toHaveBeenCalledWith('/post/member/5', {
      params: { mode: 'GIVER', size: SELLING_PAGE_SIZE },
    });
  });

  it('첫 요청에는 last_id를 보내지 않는다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getSellingPosts({ completed: false, lastId: null });

    expect(mockGet.mock.calls[0][1].params).toEqual({
      mode: 'GIVER',
      size: SELLING_PAGE_SIZE,
      completed: false,
    });
  });

  it('다음 요청에는 last_id와 completed, size를 함께 보낸다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getSellingPosts({ completed: true, lastId: 42, size: 10 });

    expect(mockGet.mock.calls[0][1].params).toEqual({
      mode: 'GIVER',
      size: 10,
      completed: true,
      last_id: 42,
    });
  });

  it('type이 있으면 함께 전달한다', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await getSellingPosts({ type: 'SERVICE' });

    expect(mockGet.mock.calls[0][1].params).toMatchObject({ type: 'SERVICE' });
  });

  it('응답 배열을 그대로 반환한다', async () => {
    const posts = [{ id: 2 }, { id: 1 }];
    mockGet.mockResolvedValue({ data: posts });

    await expect(getSellingPosts({})).resolves.toEqual(posts);
  });

  it('배열이 아닌 응답은 빈 배열로 보정한다', async () => {
    mockGet.mockResolvedValue({ data: null });

    await expect(getSellingPosts({})).resolves.toEqual([]);
  });

  it('실패 시 getErrorMessage로 변환된 Error를 던진다', async () => {
    const error = new AxiosError('fail');
    error.response = { status: 404, data: { message: '게시글을 찾을 수 없습니다.' } } as never;
    mockGet.mockRejectedValue(error);

    await expect(getSellingPosts({})).rejects.toThrow('게시글을 찾을 수 없습니다.');
  });
});
