import { getChatRoomData, getChatMessages } from '../getChatMessages';
import { instance } from '@/shared/lib/axios';
import Toast from 'react-native-toast-message';

jest.mock('@/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;

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

describe('getChatRoomData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isMine 신뢰(#619)', () => {
    // 서버(REST)가 발신자 기준으로 이미 정확한 isMine을 계산해서 내려주므로, senderId와
    // 로컬 세션(getCurrentUserId)을 다시 비교해 재계산하지 않고 서버 값을 그대로 사용한다.
    it('서버가 isMine:true로 내려준 메시지는 senderId와 무관하게 그대로 유지한다', async () => {
      const msg = makeMessage({ senderId: 99, isMine: true });
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(true);
    });

    it('서버가 isMine:false로 내려준 메시지는 senderId와 무관하게 그대로 유지한다', async () => {
      const msg = makeMessage({ senderId: 42, isMine: false });
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(false);
    });

    it('여러 메시지가 있을 때 각 메시지의 isMine을 각각 그대로 유지한다', async () => {
      const myMsg = makeMessage({ messageId: 1, senderId: 42, isMine: true });
      const otherMsg = makeMessage({ messageId: 2, senderId: 99, isMine: false });
      mockGet.mockResolvedValue({ data: [myMsg, otherMsg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(true);
      expect(result.messages[1].isMine).toBe(false);
    });
  });

  describe('응답 형식 처리', () => {
    it('배열 형식 응답을 처리한다', async () => {
      const msg = makeMessage();
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(1);
      expect(result.product).toBeNull();
    });

    it('객체 형식 응답(product + messages)을 처리한다', async () => {
      const msg = makeMessage();
      const product = makeProduct();
      mockGet.mockResolvedValue({ data: { product, messages: [msg] } });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(1);
      expect(result.product).not.toBeNull();
      expect(result.product?.id).toBe(1);
    });

    it('messages가 없는 객체 응답이면 빈 배열을 반환한다', async () => {
      mockGet.mockResolvedValue({ data: { product: makeProduct() } });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
    });

    it('빈 배열 응답이면 메시지가 없다', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
    });

    it('product가 유효하지 않으면 null로 처리한다', async () => {
      const msg = makeMessage();
      mockGet.mockResolvedValue({ data: { product: { invalid: true }, messages: [msg] } });

      const result = await getChatRoomData(100);

      expect(result.product).toBeNull();
    });

    it('응답 데이터가 null이면 메시지와 product가 비어있다', async () => {
      mockGet.mockResolvedValue({ data: null });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
      expect(result.product).toBeNull();
    });

    it('응답 데이터가 undefined이면 메시지와 product가 비어있다', async () => {
      mockGet.mockResolvedValue({ data: undefined });

      const result = await getChatRoomData(100);

      expect(result.messages).toHaveLength(0);
      expect(result.product).toBeNull();
    });
  });

  describe('에러 처리', () => {
    it('API 호출 실패 시 Toast를 보여주고 에러를 던진다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getChatRoomData(100)).rejects.toThrow();
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('에러에 message가 없으면 기본 문구로 Toast를 보여준다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValue({});

      await expect(getChatRoomData(100)).rejects.toThrow();
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', text1: '채팅방 데이터를 불러올 수 없습니다' })
      );
    });
  });
});

describe('getChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('메시지 배열만 반환한다', async () => {
    const msg = makeMessage();
    mockGet.mockResolvedValue({ data: { product: makeProduct(), messages: [msg] } });

    const result = await getChatMessages(100);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('서버가 계산한 isMine을 그대로 담은 메시지를 반환한다', async () => {
    const myMsg = makeMessage({ messageId: 1, senderId: 42, isMine: true });
    const otherMsg = makeMessage({ messageId: 2, senderId: 99, isMine: false });
    mockGet.mockResolvedValue({ data: [myMsg, otherMsg] });

    const result = await getChatMessages(100);

    expect(result[0].isMine).toBe(true);
    expect(result[1].isMine).toBe(false);
  });
});
