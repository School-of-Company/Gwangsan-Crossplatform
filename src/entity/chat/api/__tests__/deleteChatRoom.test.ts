import { http, HttpResponse } from 'msw';
import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { deleteChatRoom } from '../deleteChatRoom';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

describe('deleteChatRoom', () => {
  it('DELETE /chat/room/:roomId 요청을 보낸다', async () => {
    const requested = jest.fn();
    server.use(
      http.delete(`${BASE}/chat/room/:roomId`, ({ params }) => {
        requested(params.roomId);
        return new HttpResponse(null, { status: 204 });
      })
    );

    await expect(deleteChatRoom(42)).resolves.toBeUndefined();
    expect(requested).toHaveBeenCalledWith('42');
  });

  it('API 실패 시 토스트 없이 서버 메시지를 담은 에러를 던진다', async () => {
    server.use(
      http.delete(`${BASE}/chat/room/1`, () =>
        HttpResponse.json({ message: '채팅방을 찾을 수 없습니다' }, { status: 404 })
      )
    );

    await expect(deleteChatRoom(1)).rejects.toThrow('채팅방을 찾을 수 없습니다');
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.delete(`${BASE}/chat/room/1`, () => HttpResponse.error()));

    await expect(deleteChatRoom(1)).rejects.toThrow();
  });
});
