import { instance } from '~/shared/lib/axios';
import { cancelTrade } from '../cancelTrade';

jest.mock('~/shared/lib/axios', () => ({
  instance: { post: jest.fn() },
}));

const mockPost = instance.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('cancelTrade', () => {
  it('POST /trade/cancel/:productId로 요청하고 응답 본문을 반환한다', async () => {
    const mockRes = { status: 200, data: { cancelled: false } };
    mockPost.mockResolvedValue(mockRes);

    const result = await cancelTrade('취소 사유', [1, 2], 99);

    expect(mockPost).toHaveBeenCalledWith('/trade/cancel/99', {
      imageIds: [1, 2],
      reason: '취소 사유',
    });
    expect(result).toEqual({ cancelled: false });
  });

  it('상대방이 이미 철회를 요청해 둔 경우 cancelled: true를 반환한다', async () => {
    mockPost.mockResolvedValue({ status: 200, data: { cancelled: true } });

    const result = await cancelTrade('취소 사유', [], 99);

    expect(result).toEqual({ cancelled: true });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPost.mockRejectedValue(new Error('Server error'));

    await expect(cancelTrade('사유', [], 1)).rejects.toThrow('Server error');
  });
});
