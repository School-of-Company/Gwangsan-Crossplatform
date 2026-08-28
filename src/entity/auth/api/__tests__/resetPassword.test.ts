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

  it('실패 응답이 JSON이 아니면 응답 본문 일부를 에러 메시지로 throw한다', async () => {
    mockFetch('Internal Server Error - something went wrong', 500);
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow('Internal Server Error - something went wrong');
  });

  it('성공 응답 본문이 비어있으면 에러 없이 완료된다', async () => {
    mockFetch('', 200);
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).resolves.toBeUndefined();
  });

  it('실패 응답이 객체가 아닌 JSON(문자열)이면 HTTP 상태 메시지로 에러를 throw한다', async () => {
    mockFetch('"단순 문자열 응답"', 400, 'Bad Request');
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow('HTTP 400: Bad Request');
  });

  it('실패 응답 본문이 JSON null이면 HTTP 상태 메시지로 에러를 throw한다', async () => {
    mockFetch('null', 400, 'Bad Request');
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow('HTTP 400: Bad Request');
  });

  it('실패 응답 본문에 message 필드가 있으면 서버 메시지로 에러를 throw한다', async () => {
    mockFetch({ message: '이미 사용중인 전화번호입니다' }, 409);
    await expect(
      resetPassword({ phoneNumber: '01012345678', newPassword: 'pass' })
    ).rejects.toThrow('이미 사용중인 전화번호입니다');
  });
});
