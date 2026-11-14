import { http, HttpResponse } from 'msw';
import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { markChatAsRead } from '../markChatAsRead';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('markChatAsRead', () => {
  it('PATCH /chat/read 요청을 roomId, lastMessageId와 함께 보낸다', async () => {
    const received = jest.fn();
    server.use(
      http.patch(`${BASE}/chat/read`, async ({ request }) => {
        received(await request.json());
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(markChatAsRead(1, 100)).resolves.toBeUndefined();
    expect(received).toHaveBeenCalledWith({ roomId: 1, lastMessageId: 100 });
  });

  it('API 실패 시 토스트 없이 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.patch(`${BASE}/chat/read`, () =>
        HttpResponse.json({ message: '채팅방을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(markChatAsRead(1, 100)).rejects.toThrow('채팅방을 찾을 수 없습니다');
    expect(Toast.show).not.toHaveBeenCalled();
  });
});
