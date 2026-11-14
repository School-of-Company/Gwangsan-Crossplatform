import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { makeReservation } from '../makeReservation';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const baseRequest = {
  productId: 42,
  roomId: 10,
  scheduledAt: '2026-08-27T14:30:00',
  placeName: '상무역 2번 출구',
  address: '광주 서구 상무자유로',
  latitude: 35.15,
  longitude: 126.85,
};

describe('makeReservation', () => {
  it('PATCH /post/reservation/:productId에 productId를 뺀 예약 정보를 보낸다', async () => {
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/post/reservation/:productId`, async ({ params, request }) => {
        received(params.productId, await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(makeReservation(baseRequest)).resolves.toBeUndefined();

    const { productId: _productId, ...body } = baseRequest;
    expect(received).toHaveBeenCalledWith('42', body);
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.patch(`${BASE}/post/reservation/42`, () =>
        HttpResponse.json({ message: '이미 예약된 상품입니다' }, { status: 409 })
      )
    );

    await expect(makeReservation(baseRequest)).rejects.toThrow('이미 예약된 상품입니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.patch(`${BASE}/post/reservation/42`, () => HttpResponse.error()));

    await expect(makeReservation(baseRequest)).rejects.toThrow();
  });
});
