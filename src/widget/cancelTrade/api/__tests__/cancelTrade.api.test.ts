import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { createAxiosError } from '~/test-utils/axiosError';
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

  it('4xx는 서버 메시지로 바꾸되 상태 코드를 유지한 AxiosError로 던진다', async () => {
    mockPost.mockRejectedValue(createAxiosError(409, { message: '이미 철회된 거래입니다.' }));

    const error = await cancelTrade('사유', [], 1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(409);
    expect((error as Error).message).toBe('이미 철회된 거래입니다.');
  });
});
