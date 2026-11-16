import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { cancelReservation } from '../cancelReservation';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('cancelReservation', () => {
  it('DELETE /post/reservation/:productId를 호출하고 응답 data를 반환한다', async () => {
    const requested = jest.fn();
    server.use(
      http.delete(`${BASE}/post/reservation/:productId`, ({ params }) => {
        requested(params.productId);
        return HttpResponse.json({ message: '예약이 취소되었습니다.' });
      })
    );

    await expect(cancelReservation({ productId: 42 })).resolves.toEqual({
      message: '예약이 취소되었습니다.',
    });
    expect(requested).toHaveBeenCalledWith('42');
  });

  it('4xx 응답은 서버 메시지를 담은 에러로 던진다', async () => {
    server.use(
      http.delete(`${BASE}/post/reservation/1`, () =>
        HttpResponse.json({ message: '예약을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(cancelReservation({ productId: 1 })).rejects.toThrow('예약을 찾을 수 없습니다');
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.delete(`${BASE}/post/reservation/1`, () => HttpResponse.error()));

    await expect(cancelReservation({ productId: 1 })).rejects.toThrow();
  });
});
