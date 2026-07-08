import { instance } from '~/shared/lib/axios';
import { updateProfile } from '../updateProfile';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    patch: jest.fn(),
  },
}));

const mockPatch = instance.patch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('updateProfile', () => {
  const payload = { nickname: '새닉네임', specialties: ['요리'], description: '소개' };

  it('PATCH /member로 프로필을 수정하고 data를 반환한다', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    const result = await updateProfile(payload);

    expect(mockPatch).toHaveBeenCalledWith('/member', payload);
    expect(result).toEqual({ success: true });
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPatch.mockRejectedValue(new Error('Validation error'));

    await expect(updateProfile(payload)).rejects.toThrow('Validation error');
  });
});
