import { mockFetch } from '~/test-utils';
import { resetPassword } from '../resetPassword';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('resetPassword', () => {
  it('비밀번호 재설정 성공 시 에러 없이 완료된다', async () => {
    mockFetch({ message: 'changed' });
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'NewPass1!' })
    ).resolves.toBeUndefined();
  });

  it('올바른 바디로 PATCH 요청을 보낸다', async () => {
    mockFetch({});
    await resetPassword({ phoneNumber: '01099887766', newPassword: 'Secure123!' });
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({
      phoneNumber: '01099887766',
      newPassword: 'Secure123!',
    });
  });

  it('HTTP 에러 시 상태 코드 문자열로 에러를 throw한다', async () => {
    mockFetch(null as unknown as object, 404);
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow('404');
  });

  it('성공 응답이 JSON이 아니면 에러 없이 완료된다', async () => {
    mockFetch('OK');
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).resolves.toBeUndefined();
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow();
  });
});
