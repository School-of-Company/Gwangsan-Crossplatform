import { http, HttpResponse } from 'msw';
import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getChatRooms } from '../getChatRooms';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeRoom = (overrides: Record<string, unknown> = {}) => ({
  roomId: 1,
  member: { memberId: 2, nickname: '상대방' },
  messageId: 10,
  lastMessage: '안녕하세요',
  lastMessageType: 'TEXT',
  lastMessageTime: '2024-01-01T00:00:00Z',
  unreadMessageCount: 0,
  product: { productId: 1, title: '상품', images: [] },
  ...overrides,
});

describe('getChatRooms', () => {
  it('GET /chat/rooms 요청 후 목록을 반환한다', async () => {
    const rooms = [makeRoom()];
    server.use(http.get(`${BASE}/chat/rooms`, () => HttpResponse.json(rooms)));

    await expect(getChatRooms()).resolves.toEqual(rooms);
  });

  it('빈 목록도 정상적으로 반환한다', async () => {
    server.use(http.get(`${BASE}/chat/rooms`, () => HttpResponse.json([])));

    await expect(getChatRooms()).resolves.toEqual([]);
  });

  it('폴링 중 토스트가 쌓이지 않도록 실패해도 토스트 없이 에러를 던진다', async () => {
    server.use(
      http.get(`${BASE}/chat/rooms`, () =>
        HttpResponse.json({ message: '서버 오류' }, { status: 500 })
      )
    );

    await expect(getChatRooms()).rejects.toThrow('요청이 실패했습니다. (500)');
    expect(Toast.show).not.toHaveBeenCalled();
  });

  it('네트워크 오류는 에러를 던진다', async () => {
    server.use(http.get(`${BASE}/chat/rooms`, () => HttpResponse.error()));

    await expect(getChatRooms()).rejects.toThrow();
  });
});
