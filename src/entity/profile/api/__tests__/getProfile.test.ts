import { instance } from '~/shared/lib/axios';
import { getProfile } from '../getProfile';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getProfile', () => {
  it('GET /member/:id 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: { memberId: 42, nickname: '상대방' } });

    const result = await getProfile('42');

    expect(mockGet).toHaveBeenCalledWith('/member/42');
    expect(result).toEqual({ memberId: 42, nickname: '상대방' });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Not found'));

    await expect(getProfile('99')).rejects.toThrow('Not found');
  });
});
