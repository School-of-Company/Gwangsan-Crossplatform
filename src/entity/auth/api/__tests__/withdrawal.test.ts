import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { withdrawal } from '../withdrawal';

jest.mock('~/shared/lib/axios', () => ({
  instance: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  },
}));

const mockInstance = instance as jest.Mocked<typeof instance>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('withdrawal', () => {
  it('탈퇴 성공 시 응답을 반환한다', async () => {
    mockInstance.delete.mockResolvedValue({ data: { message: 'success' } });

    const result = await withdrawal();

    expect(result).toEqual({ message: 'success' });
  });

  it('/member 엔드포인트로 DELETE 요청을 보낸다', async () => {
    mockInstance.delete.mockResolvedValue({ data: { message: 'ok' } });

    await withdrawal();

    expect(mockInstance.delete).toHaveBeenCalledWith('/member');
  });

  it('서버 에러 시 에러를 throw한다', async () => {
    const error = new AxiosError('Forbidden');
    (error as any).response = {
      status: 403,
      data: { message: '탈퇴 처리 중 오류가 발생했습니다' },
    };
    mockInstance.delete.mockRejectedValue(error);

    await expect(withdrawal()).rejects.toThrow('탈퇴 처리 중 오류가 발생했습니다');
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    mockInstance.delete.mockRejectedValue(new Error('Network Error'));

    await expect(withdrawal()).rejects.toThrow('Network Error');
  });

  it('응답에 status가 있으면 코드 기반 에러 메시지를 throw한다', async () => {
    const error = new AxiosError('Internal Server Error');
    (error as any).response = { status: 500, data: {} };
    mockInstance.delete.mockRejectedValue(error);

    await expect(withdrawal()).rejects.toThrow('요청이 실패했습니다. (500)');
  });
});
