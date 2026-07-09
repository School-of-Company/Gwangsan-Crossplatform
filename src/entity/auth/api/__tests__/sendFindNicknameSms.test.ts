import { mockFetch } from '~/test-utils';
import { sendFindNicknameSms } from '../sendFindNicknameSms';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendFindNicknameSms', () => {
  it('정상적인 전화번호로 SMS 전송에 성공한다', async () => {
    mockFetch({ message: 'success' });
    await expect(sendFindNicknameSms('01012345678')).resolves.not.toThrow();
  });

  it('/sms/nickname 엔드포인트로 phoneNumber를 전송한다', async () => {
    mockFetch({ message: 'ok' });
    await sendFindNicknameSms('01099998888');
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/sms/nickname');
    expect(JSON.parse(options.body)).toEqual({ phoneNumber: '01099998888' });
  });

  it('HTTP 에러 시 서버 메시지로 에러를 throw한다', async () => {
    mockFetch({ message: '존재하지 않는 전화번호입니다' }, 404);
    await expect(sendFindNicknameSms('01012345678')).rejects.toThrow(
      '존재하지 않는 전화번호입니다'
    );
  });

  it('HTTP 에러이고 message 필드가 없으면 HTTP 상태 메시지로 throw한다', async () => {
    mockFetch({}, 500, 'Internal Server Error');
    await expect(sendFindNicknameSms('01012345678')).rejects.toThrow();
  });

  it('응답이 유효하지 않은 JSON이면 잘린 텍스트로 에러를 throw한다', async () => {
    mockFetch('<html>error</html>', 503);
    await expect(sendFindNicknameSms('01012345678')).rejects.toThrow();
  });

  it('네트워크 에러 시 에러를 throw한다', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(sendFindNicknameSms('01012345678')).rejects.toThrow();
  });
});
