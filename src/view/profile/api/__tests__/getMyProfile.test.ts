import { instance } from '~/shared/lib/axios';
import { getMyProfile } from '../getMyProfile';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    get: jest.fn(),
  },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getMyProfile', () => {
  it('GET /member 응답 data를 반환한다', async () => {
    mockGet.mockResolvedValue({ data: { memberId: 1, nickname: '광산인' } });

    const result = await getMyProfile();

    expect(mockGet).toHaveBeenCalledWith('/member');
    expect(result).toEqual({ memberId: 1, nickname: '광산인' });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    await expect(getMyProfile()).rejects.toThrow('Network error');
  });
});
