import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { cancelTrade } from '../cancelTrade';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('cancelTrade', () => {
  it('POST /trade/cancel/:productId로 사유와 이미지를 보내고 응답 본문을 반환한다', async () => {
    const received = jest.fn();
    server.use(
      http.post(`${BASE}/trade/cancel/:productId`, async ({ params, request }) => {
        received(params.productId, await request.json());
        return HttpResponse.json({ cancelled: false });
      })
    );

    await expect(cancelTrade('취소 사유', [1, 2], 99)).resolves.toEqual({ cancelled: false });
    expect(received).toHaveBeenCalledWith('99', { imageIds: [1, 2], reason: '취소 사유' });
  });

  it('상대방이 이미 철회를 요청해 둔 경우 cancelled: true를 반환한다', async () => {
    server.use(http.post(`${BASE}/trade/cancel/99`, () => HttpResponse.json({ cancelled: true })));

    await expect(cancelTrade('취소 사유', [], 99)).resolves.toEqual({ cancelled: true });
  });

  it('4xx는 서버 메시지로 바꾸되 상태 코드를 유지한 AxiosError로 던진다', async () => {
    server.use(
      http.post(`${BASE}/trade/cancel/1`, () =>
        HttpResponse.json({ message: '이미 철회된 거래입니다.' }, { status: 409 })
      )
    );

    const error = await cancelTrade('사유', [], 1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(409);
    expect((error as Error).message).toBe('이미 철회된 거래입니다.');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/trade/cancel/1`, () => HttpResponse.error()));

    await expect(cancelTrade('사유', [], 1)).rejects.toThrow();
  });
});
