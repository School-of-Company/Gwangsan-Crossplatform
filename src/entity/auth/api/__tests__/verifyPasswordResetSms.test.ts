import { mockFetch } from '~/test-utils';
import { verifyPasswordResetSms } from '../verifyPasswordResetSms';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('verifyPasswordResetSms', () => {
  it('인증 성공 시 에러 없이 완료된다', async () => {
    mockFetch({ verified: true });
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '112233' })
    ).resolves.toBeUndefined();
  });

  it('올바른 바디로 요청을 보낸다', async () => {
    mockFetch({});
    await verifyPasswordResetSms({ phoneNumber: '01099887766', code: '999888' });
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ phoneNumber: '01099887766', code: '999888' });
  });

  it('HTTP 에러 시 상태 코드 문자열로 에러를 throw한다', async () => {
    mockFetch(null as unknown as object, 400);
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '000000' })
    ).rejects.toThrow('400');
  });

  it('성공 응답이 JSON이 아니면 에러 없이 완료된다', async () => {
    mockFetch('VERIFIED');
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).resolves.toBeUndefined();
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow();
  });

  it('실패 응답이 JSON이 아니면 응답 본문 일부를 에러 메시지로 throw한다', async () => {
    mockFetch('Bad Gateway - upstream error', 502);
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow('Bad Gateway - upstream error');
  });

  it('성공 응답 본문이 비어있으면 에러 없이 완료된다', async () => {
    mockFetch('', 200);
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).resolves.toBeUndefined();
  });

  it('실패 응답이 객체가 아닌 JSON(문자열)이면 HTTP 상태 메시지로 에러를 throw한다', async () => {
    mockFetch('"단순 문자열 응답"', 400, 'Bad Request');
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow('HTTP 400: Bad Request');
  });

  it('실패 응답 본문이 JSON null이면 HTTP 상태 메시지로 에러를 throw한다', async () => {
    mockFetch('null', 400, 'Bad Request');
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow('HTTP 400: Bad Request');
  });

  it('실패 응답 본문에 message 필드가 있으면 서버 메시지로 에러를 throw한다', async () => {
    mockFetch({ message: '인증번호가 일치하지 않습니다' }, 400);
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow('인증번호가 일치하지 않습니다');
  });
});
