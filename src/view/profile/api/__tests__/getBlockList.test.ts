import { instance } from '~/shared/lib/axios';
import { getBlockList } from '../getBlockList';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getBlockList', () => {
  it('GET /block 응답 data를 반환한다', async () => {
    const list = [{ memberId: 3, nickname: '차단된유저' }];
    mockGet.mockResolvedValue({ data: list });

    const result = await getBlockList();

    expect(mockGet).toHaveBeenCalledWith('/block');
    expect(result).toEqual(list);
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));

    await expect(getBlockList()).rejects.toThrow('Server error');
  });
});
