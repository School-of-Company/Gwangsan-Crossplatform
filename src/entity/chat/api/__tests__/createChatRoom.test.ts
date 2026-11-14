import { AxiosError } from 'axios';
import { http, HttpResponse } from 'msw';
import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { createChatRoom } from '../createChatRoom';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('createChatRoom', () => {
  it('POST /chat/room/:productId 요청 후 roomId를 반환한다', async () => {
    const requested = jest.fn();
    server.use(
      http.post(`${BASE}/chat/room/:productId`, ({ params }) => {
        requested(params.productId);
        return HttpResponse.json({ roomId: 123 });
      })
    );

    await expect(createChatRoom(42)).resolves.toEqual({ roomId: 123 });
    expect(requested).toHaveBeenCalledWith('42');
  });

  it('API 실패 시 토스트 없이 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.post(`${BASE}/chat/room/1`, () =>
        HttpResponse.json({ message: '본인 상품에는 채팅할 수 없습니다' }, { status: 400 })
      )
    );

    const error = await createChatRoom(1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(400);
    expect((error as Error).message).toBe('본인 상품에는 채팅할 수 없습니다');
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('5xx는 상태 코드만 알리는 에러를 던진다', async () => {
    server.use(http.post(`${BASE}/chat/room/1`, () => new HttpResponse(null, { status: 500 })));

    const error = await createChatRoom(1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).response?.status).toBe(500);
    expect((error as Error).message).toBe('요청이 실패했습니다. (500)');
  });
});
