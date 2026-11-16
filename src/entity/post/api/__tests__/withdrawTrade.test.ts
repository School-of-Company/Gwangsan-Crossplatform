import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { withdrawTrade } from '../withdrawTrade';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('withdrawTrade', () => {
  it('DELETE /post/trade에 payload를 body로 보낸다', async () => {
    const received = jest.fn();
    server.use(
      http.delete(`${BASE}/post/trade`, async ({ request }) => {
        received(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(withdrawTrade({ productId: 42, otherMemberId: 7 })).resolves.toBeUndefined();
    expect(received).toHaveBeenCalledWith({ productId: 42, otherMemberId: 7 });
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.delete(`${BASE}/post/trade`, () =>
        HttpResponse.json({ message: '거래 완료 요청자가 아닙니다.' }, { status: 403 })
      )
    );

    await expect(withdrawTrade({ productId: 1, otherMemberId: 2 })).rejects.toThrow(
      '거래 완료 요청자가 아닙니다.'
    );
  });
});
