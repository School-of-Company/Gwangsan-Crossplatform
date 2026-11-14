import { http, HttpResponse } from 'msw';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { findChatRoom } from '../findChatRoom';

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('findChatRoom', () => {
  it('GET /chat/room/:productId 요청 후 roomId를 반환한다', async () => {
    const requested = jest.fn();
    server.use(
      http.get(`${BASE}/chat/room/:productId`, ({ params }) => {
        requested(params.productId);
        return HttpResponse.json({ roomId: 55, extra: 'ignored' });
      })
    );

    await expect(findChatRoom(88)).resolves.toEqual({ roomId: 55 });
    expect(requested).toHaveBeenCalledWith('88');
  });

  it('채팅방이 없으면(404) 상태 코드를 유지한 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/chat/room/1`, () =>
        HttpResponse.json({ message: '채팅방을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(findChatRoom(1)).rejects.toMatchObject({
      message: '채팅방을 찾을 수 없습니다',
      response: { status: 404 },
    });
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/chat/room/1`, () => HttpResponse.error()));

    await expect(findChatRoom(1)).rejects.toThrow();
  });
});
