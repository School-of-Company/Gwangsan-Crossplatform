import { mockFetch } from '~/test-utils';
import { verifyFindNicknameSms } from '../verifyFindNicknameSms';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('verifyFindNicknameSms', () => {
  it('인증 성공 시 에러 없이 완료된다', async () => {
    mockFetch({ verified: true });
    await expect(verifyFindNicknameSms('01012345678', '112233')).resolves.toBeUndefined();
  });

  it('올바른 바디로 요청을 보낸다', async () => {
    mockFetch({});
    await verifyFindNicknameSms('01099887766', '999888');
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/sms/nickname/verify');
    expect(JSON.parse(options.body)).toEqual({ phoneNumber: '01099887766', code: '999888' });
  });

  it('HTTP 에러 시 상태 코드 문자열로 에러를 throw한다', async () => {
    mockFetch(null as unknown as object, 400);
    await expect(verifyFindNicknameSms('01012345678', '000000')).rejects.toThrow('400');
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network Error'));
    await expect(verifyFindNicknameSms('01012345678', '123456')).rejects.toThrow('Network Error');
  });
});
