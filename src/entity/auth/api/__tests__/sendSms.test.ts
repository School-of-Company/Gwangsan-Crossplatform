import { sendSms } from '../sendSms';

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

describe('sendSms', () => {
  it('정상적인 전화번호로 SMS 전송에 성공한다', async () => {
    mockFetch({ message: 'success' });
    expect(await sendSms('01012345678')).toEqual({ message: 'success' });
  });

  it('올바른 엔드포인트와 바디로 요청을 보낸다', async () => {
    mockFetch({ message: 'ok' });
    await sendSms('01099998888');
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/sms');
    expect(JSON.parse(options.body)).toEqual({ phoneNumber: '01099998888' });
  });

  it('HTTP 에러 시 서버 메시지로 에러를 throw한다', async () => {
    mockFetch({ message: '이미 가입된 전화번호입니다' }, 400);
    await expect(sendSms('01012345678')).rejects.toThrow('이미 가입된 전화번호입니다');
  });

  it('HTTP 에러이고 message 필드가 없으면 HTTP 상태 메시지로 throw한다', async () => {
    mockFetch({}, 429, 'Too Many Requests');
    await expect(sendSms('01012345678')).rejects.toThrow();
  });

  it('응답이 유효하지 않은 JSON이면 잘린 텍스트로 에러를 throw한다', async () => {
    mockFetch('<!DOCTYPE html><html>Internal Server Error</html>', 500);
    await expect(sendSms('01012345678')).rejects.toThrow();
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(sendSms('01012345678')).rejects.toThrow();
  });
});
