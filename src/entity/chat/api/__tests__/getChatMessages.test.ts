import { getChatRoomData, getChatMessages } from '../getChatMessages';
import { instance } from '@/shared/lib/axios';
import { getCurrentUserId } from '~/shared/lib/getCurrentUserId';
import Toast from 'react-native-toast-message';

jest.mock('@/shared/lib/axios', () => ({
  instance: { get: jest.fn() },
}));

jest.mock('~/shared/lib/getCurrentUserId', () => ({
  getCurrentUserId: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockGet = instance.get as jest.Mock;
const mockGetCurrentUserId = getCurrentUserId as jest.Mock;

const MY_USER_ID = 42;

const makeMessage = (overrides: Record<string, unknown> = {}) => ({
  messageId: 1,
  roomId: 100,
  content: '안녕하세요',
  messageType: 'TEXT',
  createdAt: '2024-01-01T00:00:00Z',
  senderNickname: '테스터',
  senderId: MY_USER_ID,
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
});

describe('getChatRoomData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUserId.mockResolvedValue(MY_USER_ID);
  });

  describe('isMine 계산', () => {
    it('senderId가 현재 userId와 같으면 isMine이 true이다', async () => {
      const msg = makeMessage({ senderId: MY_USER_ID });
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(true);
    });

    it('senderId가 현재 userId와 다르면 isMine이 false이다', async () => {
      const msg = makeMessage({ senderId: 99 });
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(false);
    });

    it('여러 메시지가 있을 때 각각 isMine을 올바르게 계산한다', async () => {
      const myMsg = makeMessage({ messageId: 1, senderId: MY_USER_ID });
      const otherMsg = makeMessage({ messageId: 2, senderId: 99 });
      mockGet.mockResolvedValue({ data: [myMsg, otherMsg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(true);
      expect(result.messages[1].isMine).toBe(false);
    });

    it('백엔드가 isMine을 내려줘도 userId 기반으로 덮어쓴다', async () => {
      const msg = makeMessage({ senderId: MY_USER_ID, isMine: false });
      mockGet.mockResolvedValue({ data: [msg] });

      const result = await getChatRoomData(100);

      expect(result.messages[0].isMine).toBe(true);
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
  });

  describe('에러 처리', () => {
    it('API 호출 실패 시 Toast를 보여주고 에러를 던진다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(getChatRoomData(100)).rejects.toThrow();
      expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    });

    it('API와 getCurrentUserId를 병렬로 호출한다', async () => {
      const callOrder: string[] = [];
      mockGet.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // API 호출 지연 시뮬레이션
        callOrder.push('api');
        return { data: [] };
      });
      mockGetCurrentUserId.mockImplementation(async () => {
        callOrder.push('userId');
        return MY_USER_ID;
      });

      await getChatRoomData(100);

      expect(callOrder).toEqual(['userId', 'api']);
    });
  });
});

describe('getChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUserId.mockResolvedValue(MY_USER_ID);
  });

  it('메시지 배열만 반환한다', async () => {
    const msg = makeMessage();
    mockGet.mockResolvedValue({ data: { product: makeProduct(), messages: [msg] } });

    const result = await getChatMessages(100);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('isMine이 올바르게 계산된 메시지를 반환한다', async () => {
    const myMsg = makeMessage({ messageId: 1, senderId: MY_USER_ID });
    const otherMsg = makeMessage({ messageId: 2, senderId: 99 });
    mockGet.mockResolvedValue({ data: [myMsg, otherMsg] });

    const result = await getChatMessages(100);

    expect(result[0].isMine).toBe(true);
    expect(result[1].isMine).toBe(false);
  });
});
