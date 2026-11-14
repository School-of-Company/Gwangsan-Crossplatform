import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { report } from '../report';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const captureReport = () => {
  const received = jest.fn();
  server.use(
    http.post(`${BASE}/report`, async ({ request }) => {
      received(await request.json());
      return new HttpResponse(null, { status: 204 });
    })
  );
  return received;
};

describe('report', () => {
  it('PRODUCT 신고는 productId를 sourceId로 보낸다', async () => {
    const received = captureReport();

    await report({
      targetType: 'PRODUCT',
      productId: 5,
      memberId: 42,
      reason: 'SPAM_AD',
      content: '스팸 게시글입니다.',
      imageIds: [1, 2],
    });

    expect(received).toHaveBeenCalledWith({
      sourceId: 5,
      targetType: 'PRODUCT',
      reportType: 'SPAM_AD',
      content: '스팸 게시글입니다.',
      imageIds: [1, 2],
    });
  });

  it('MEMBER 신고는 memberId를 sourceId로 보낸다', async () => {
    const received = captureReport();

    await report({
      targetType: 'MEMBER',
      memberId: 99,
      reason: 'ABUSE_HATE_HARASSMENT',
      content: '욕설을 사용했습니다.',
      imageIds: [],
    });

    expect(received).toHaveBeenCalledWith({
      sourceId: 99,
      targetType: 'MEMBER',
      reportType: 'ABUSE_HATE_HARASSMENT',
      content: '욕설을 사용했습니다.',
      imageIds: [],
    });
  });

  it.each([
    'SEXUAL',
    'ABUSE_HATE_HARASSMENT',
    'SPAM_AD',
    'IMPERSONATION',
    'SELF_HARM_DANGER',
    'ETC',
  ] as const)('%s 사유를 reportType으로 보낸다', async (reason) => {
    const received = captureReport();

    await report({ targetType: 'MEMBER', memberId: 1, reason, content: '신고 내용', imageIds: [] });

    expect(received).toHaveBeenCalledWith(expect.objectContaining({ reportType: reason }));
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.post(`${BASE}/report`, () =>
        HttpResponse.json({ message: '이미 신고한 대상입니다' }, { status: 409 })
      )
    );

    await expect(
      report({ targetType: 'MEMBER', memberId: 1, reason: 'ETC', content: '내용', imageIds: [] })
    ).rejects.toThrow('이미 신고한 대상입니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/report`, () => HttpResponse.error()));

    await expect(
      report({ targetType: 'MEMBER', memberId: 1, reason: 'ETC', content: '내용', imageIds: [] })
    ).rejects.toThrow();
  });
});
