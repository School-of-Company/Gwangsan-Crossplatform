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

  it('PATCH /member로 프로필 수정을 요청한다', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    const result = await updateProfile(payload);

    expect(mockPatch).toHaveBeenCalledWith('/member', payload);
    expect(result).toBeUndefined();
  });

  it('API 실패 시 에러를 전파한다', async () => {
    mockPatch.mockRejectedValue(new Error('Validation error'));

    await expect(updateProfile(payload)).rejects.toThrow('Validation error');
  });

  it('서버 원문 대신 사용자용 메시지로 바꿔 던진다(#739)', async () => {
    const { AxiosError, AxiosHeaders } = jest.requireActual('axios');
    mockPatch.mockRejectedValue(
      new AxiosError('Request failed with status code 400', '400', undefined, undefined, {
        status: 400,
        statusText: '',
        data: { message: '이미 사용 중인 별칭입니다.' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      })
    );

    await expect(updateProfile(payload)).rejects.toThrow('이미 사용 중인 별칭입니다.');
  });

  it('409(별칭 중복)는 원인을 알 수 있는 메시지로 바꿔 던진다(#780)', async () => {
    const { AxiosError, AxiosHeaders } = jest.requireActual('axios');
    mockPatch.mockRejectedValue(
      new AxiosError('Request failed with status code 409', '409', undefined, undefined, {
        status: 409,
        statusText: '',
        data: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
      })
    );

    await expect(updateProfile(payload)).rejects.toThrow(
      '이미 사용 중인 별칭입니다. 다른 별칭을 입력해주세요.'
    );
  });
});
