import { instance } from '~/shared/lib/axios';
import { blockUser, unblockUser } from '../blockUser';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockPost = instance.post as jest.Mock;
const mockDelete = instance.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('blockUser', () => {
  it('POST /block/:id 응답 data를 반환한다', async () => {
    mockPost.mockResolvedValue({ data: { blocked: true } });

    const result = await blockUser(7);

    expect(mockPost).toHaveBeenCalledWith('/block/7');
    expect(result).toEqual({ blocked: true });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPost.mockRejectedValue(new Error('Block failed'));

    await expect(blockUser(7)).rejects.toThrow('Block failed');
  });
});

describe('unblockUser', () => {
  it('DELETE /block/:id 응답 data를 반환한다', async () => {
    mockDelete.mockResolvedValue({ data: { unblocked: true } });

    const result = await unblockUser(7);

    expect(mockDelete).toHaveBeenCalledWith('/block/7');
    expect(result).toEqual({ unblocked: true });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockDelete.mockRejectedValue(new Error('Unblock failed'));

    await expect(unblockUser(7)).rejects.toThrow('Unblock failed');
  });
});
