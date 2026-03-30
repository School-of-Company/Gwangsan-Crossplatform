import { mockFetch } from '~/test-utils';
import { verifyPasswordResetSms } from '../verifyPasswordResetSms';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('verifyPasswordResetSms', () => {
  it('인증 성공 시 응답 데이터를 반환한다', async () => {
    mockFetch({ verified: true });
    expect(await verifyPasswordResetSms({ phoneNumber: '01012345678', code: '112233' })).toEqual({
      verified: true,
    });
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

  it('성공 응답이 JSON이 아니면 빈 객체를 반환한다', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch('VERIFIED');
    expect(await verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })).toEqual(
      {}
    );
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    await expect(
      verifyPasswordResetSms({ phoneNumber: '01012345678', code: '123456' })
    ).rejects.toThrow();
  });
});
