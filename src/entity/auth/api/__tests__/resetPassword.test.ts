import { AxiosError, AxiosHeaders } from 'axios';
import { publicInstance } from '~/shared/lib/publicInstance';
import { resetPassword } from '../resetPassword';

jest.mock('~/shared/lib/publicInstance', () => ({
  publicInstance: { post: jest.fn(), patch: jest.fn() },
}));
jest.mock('~/shared/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const mockRequest = publicInstance.patch as jest.Mock;

const axiosError = (status: number, data: unknown) =>
  new AxiosError('Request failed', String(status), undefined, undefined, {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

beforeEach(() => jest.clearAllMocks());

describe('resetPassword', () => {
  it('올바른 엔드포인트와 바디로 요청한다', async () => {
    mockRequest.mockResolvedValue({ data: {} });

    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'newpass123!' })
    ).resolves.toBeUndefined();

    expect(mockRequest).toHaveBeenCalledWith('/auth/password', {
      phoneNumber: '01012345678',
      newPassword: 'newpass123!',
    });
  });

  it('서버가 보낸 에러 메시지로 에러를 던진다', async () => {
    mockRequest.mockRejectedValue(axiosError(400, { message: '인증번호가 올바르지 않습니다.' }));

    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'newpass123!' })
    ).rejects.toThrow('인증번호가 올바르지 않습니다.');
  });

  it('5xx는 서버 내부 메시지 대신 상태 코드만 알린다', async () => {
    mockRequest.mockRejectedValue(
      axiosError(500, '<!DOCTYPE html><html>Internal Server Error</html>')
    );

    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'newpass123!' })
    ).rejects.toThrow('요청이 실패했습니다. (500)');
  });

  it('네트워크 에러도 그대로 던진다', async () => {
    mockRequest.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'newpass123!' })
    ).rejects.toThrow('timeout of 10000ms exceeded');
  });
});
