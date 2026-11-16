import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { requestTrade } from '../requestTrade';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('requestTrade', () => {
  it('POST /post/trade에 payload를 보내고 응답 data를 반환한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/post/trade`, async ({ request }) => {
        received(await request.json());
        return HttpResponse.json({ success: true, roomId: 99 });
      })
    );

    await expect(requestTrade({ productId: 42, otherMemberId: 7 })).resolves.toEqual({
      success: true,
      roomId: 99,
    });
    expect(received).toHaveBeenCalledWith({ productId: 42, otherMemberId: 7 });
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.post(`${BASE}/post/trade`, () =>
        HttpResponse.json({ message: '이미 거래 중입니다' }, { status: 400 })
      )
    );

    await expect(requestTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow(
      '이미 거래 중입니다'
    );
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/post/trade`, () => HttpResponse.error()));

    await expect(requestTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow();
  });
});
