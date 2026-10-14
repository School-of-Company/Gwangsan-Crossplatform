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
  it('POST /block/:id 로 차단을 요청한다', async () => {
    mockPost.mockResolvedValue({ data: { blocked: true } });

    const result = await blockUser(7);

    expect(mockPost).toHaveBeenCalledWith('/block/7');
    expect(result).toBeUndefined();
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPost.mockRejectedValue(new Error('Block failed'));

    await expect(blockUser(7)).rejects.toThrow('Block failed');
  });
});

describe('unblockUser', () => {
  it('DELETE /block/:id 로 차단 해제를 요청한다', async () => {
    mockDelete.mockResolvedValue({ data: { unblocked: true } });

    const result = await unblockUser(7);

    expect(mockDelete).toHaveBeenCalledWith('/block/7');
    expect(result).toBeUndefined();
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockDelete.mockRejectedValue(new Error('Unblock failed'));

    await expect(unblockUser(7)).rejects.toThrow('Unblock failed');
  });
});
