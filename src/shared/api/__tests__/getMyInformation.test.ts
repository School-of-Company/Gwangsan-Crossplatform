import { instance } from '~/shared/lib/axios';
import { getMyInformation } from '../getMyInformation';

jest.mock('~/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('getMyInformation', () => {
  it('GET /member 응답 data를 반환한다', async () => {
    const memberInfo = { memberId: 1, headName: '본점', dongName: '동', placeName: '지점' };
    mockGet.mockResolvedValue({ data: memberInfo });

    const result = await getMyInformation();

    expect(mockGet).toHaveBeenCalledWith('/member');
    expect(result).toEqual(memberInfo);
  });

  it('API 실패 시 원본 에러를 그대로 전파한다', async () => {
    const error = new Error('Server error');
    mockGet.mockRejectedValue(error);

    await expect(getMyInformation()).rejects.toThrow('Server error');
  });

  it('네트워크 에러 시에도 에러를 전파한다', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(getMyInformation()).rejects.toThrow('Network Error');
  });
});
