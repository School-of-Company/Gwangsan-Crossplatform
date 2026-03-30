import { verifySms } from '../verifySms';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

function mockFetch(body: object | string, status = 200, statusText = '') {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(text),
  });
}

describe('verifySms', () => {
  it('인증 성공 시 응답 데이터를 반환한다', async () => {
    mockFetch({ verified: true });
    expect(await verifySms('01012345678', '123456')).toEqual({ verified: true });
  });

  it('올바른 바디로 요청을 보낸다', async () => {
    mockFetch({});
    await verifySms('01011112222', '654321');
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ phoneNumber: '01011112222', code: '654321' });
  });

  it('HTTP 에러 시 상태 코드 기반 에러를 throw한다', async () => {
    mockFetch(null as unknown as object, 401, 'Unauthorized');
    await expect(verifySms('01012345678', '000000')).rejects.toThrow('HTTP 401: Unauthorized');
  });

  it('응답이 JSON이 아니면 빈 객체를 반환한다', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetch('OK');
    expect(await verifySms('01012345678', '123456')).toEqual({});
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(verifySms('01012345678', '123456')).rejects.toThrow();
  });
});
