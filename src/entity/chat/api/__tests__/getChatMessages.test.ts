import { http, HttpResponse, type JsonBodyType } from 'msw';
import Toast from 'react-native-toast-message';
import { instance } from '~/shared/lib/axios';
import { server } from '~/mocks/server';
import { getChatRoomData, getChatMessages, CHAT_MESSAGE_PAGE_SIZE } from '../getChatMessages';

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const BASE = 'http://test-api.com';

beforeAll(() => {
  instance.defaults.baseURL = BASE;
});

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  messageId: 1,
  roomId: 100,
  content: '안녕하세요',
  messageType: 'TEXT',
  createdAt: '2024-01-01T00:00:00Z',
  senderNickname: '테스터',
  senderId: 42,
  checked: false,
  isMine: false,
  ...overrides,
});

const makeProduct = () => ({
  id: 1,
  title: '상품',
  images: [],
  createdAt: null,
  isSeller: false,
  isCompletable: false,
  isCompleted: false,
  isReserved: false,
});

const useRoomResponse = (body: JsonBodyType) =>
  server.use(http.get(`${BASE}/chat/100`, () => HttpResponse.json(body)));

describe('getChatRoomData', () => {
  describe('isMine 신뢰', () => {
    // 서버(REST)가 발신자 기준으로 이미 정확한 isMine을 계산해서 내려주므로, senderId와
    // 로컬 세션을 다시 비교해 재계산하지 않고 서버 값을 그대로 사용한다.
    it('서버가 내려준 isMine을 senderId와 무관하게 메시지마다 그대로 유지한다', async () => {
      useRoomResponse([
        makeMessage({ messageId: 1, senderId: 99, isMine: true }),
        makeMessage({ messageId: 2, senderId: 42, isMine: false }),
      ]);

      const result = await getChatRoomData(100);

      expect(result.messages.map((m) => m.isMine)).toEqual([true, false]);
    });
  });

  describe('페이지 요청', () => {
    const captureQuery = () => {
      const received = jest.fn();
      server.use(
        http.get(`${BASE}/chat/100`, ({ request }) => {
          received(Object.fromEntries(new URL(request.url).searchParams));
          return HttpResponse.json({ messages: [] });
        })
      );
      return received;
    };

    it('커서 없이 부르면 최신 페이지를 페이지 크기만큼 요청한다', async () => {
      const received = captureQuery();

      await getChatRoomData(100);

      expect(received).toHaveBeenCalledWith({ limit: String(CHAT_MESSAGE_PAGE_SIZE) });
    });

    it('커서를 넘기면 lastCreatedAt·lastMessageId로 이전 페이지를 요청한다', async () => {
      const received = captureQuery();

      await getChatRoomData(100, {
        cursor: { lastCreatedAt: '2026-01-02T03:04:05', lastMessageId: 9 },
        limit: 10,
      });

      expect(received).toHaveBeenCalledWith({
        lastCreatedAt: '2026-01-02T03:04:05',
        lastMessageId: '9',
        limit: '10',
      });
    });
  });

  describe('응답 형식 처리', () => {
    it('배열 형식 응답을 처리한다', async () => {
      useRoomResponse([makeMessage()]);

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(1);
      expect(result.product).toBeNull();
    });

    it('객체 형식 응답(product + messages)을 처리한다', async () => {
      useRoomResponse({ product: makeProduct(), messages: [makeMessage()] });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(1);
      expect(result.product?.id).toBe(1);
    });

    it('messages가 없는 객체 응답이면 빈 배열을 반환한다', async () => {
      useRoomResponse({ product: makeProduct() });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
    });

    it('빈 배열 응답이면 메시지가 없다', async () => {
      useRoomResponse([]);

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
    });

    it('product가 유효하지 않으면 null로 처리한다', async () => {
      useRoomResponse({ product: { invalid: true }, messages: [makeMessage()] });

      const result = await getChatRoomData(100);

      expect(result.product).toBeNull();
    });

    it('응답 본문이 null이거나 비어 있으면 메시지와 product가 비어있다', async () => {
      useRoomResponse(null);
      await expect(getChatRoomData(100)).resolves.toEqual({ messages: [], product: null });

      server.use(http.get(`${BASE}/chat/100`, () => new HttpResponse(null, { status: 204 })));
      await expect(getChatRoomData(100)).resolves.toEqual({ messages: [], product: null });
    });
  });

  describe('에러 처리', () => {
    it('API 호출 실패 시 토스트 없이 서버 메시지를 담은 에러를 던진다', async () => {
      server.use(
        http.get(`${BASE}/chat/100`, () =>
          HttpResponse.json({ message: '채팅방에 참여한 회원이 아닙니다' }, { status: 403 })
        )
      );

      await expect(getChatRoomData(100)).rejects.toThrow('채팅방에 참여한 회원이 아닙니다');
      expect(Toast.show).not.toHaveBeenCalled();
    });

    it('네트워크 오류는 에러를 던진다', async () => {
      server.use(http.get(`${BASE}/chat/100`, () => HttpResponse.error()));

      await expect(getChatRoomData(100)).rejects.toThrow();
    });
  });
});

describe('getChatMessages', () => {
  it('product를 빼고 메시지 배열만 반환한다', async () => {
    useRoomResponse({ product: makeProduct(), messages: [makeMessage()] });

    const result = await getChatMessages(100);

    expect(result).toEqual([makeMessage()]);
  });

  it('서버가 계산한 isMine을 그대로 담은 메시지를 반환한다', async () => {
    useRoomResponse([
      makeMessage({ messageId: 1, senderId: 42, isMine: true }),
      makeMessage({ messageId: 2, senderId: 99, isMine: false }),
    ]);

    const result = await getChatMessages(100);

    expect(result.map((m) => m.isMine)).toEqual([true, false]);
  });
});
