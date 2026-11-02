import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useChatQueueStore,
  MESSAGE_STATUS,
  CHAT_QUEUE_STORAGE_KEY,
  type PendingMessage,
} from '../useChatQueueStore';

// 경로에 'exists'가 들어간 로컬 파일만 아직 남아 있다고 본다
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((uri: string) => ({ exists: uri.includes('exists') })),
}));

const makePending = (overrides: Partial<PendingMessage> = {}): PendingMessage => ({
  tempId: 'temp-1',
  roomId: 1,
  content: '안녕하세요',
  messageType: 'TEXT',
  imageIds: [],
  status: MESSAGE_STATUS.PENDING,
  createdAt: '2026-11-01T00:00:00.000Z',
  retryCount: 0,
  ...overrides,
});

const writeStoredQueue = async (pendingMessages: PendingMessage[]) => {
  await AsyncStorage.setItem(
    CHAT_QUEUE_STORAGE_KEY,
    JSON.stringify({ state: { pendingMessages }, version: 1 })
  );
};

const readStoredQueue = async () => {
  const raw = await AsyncStorage.getItem(CHAT_QUEUE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useChatQueueStore.setState({ pendingMessages: [] });
});

describe('useChatQueueStore 영구 저장', () => {
  it('대기 메시지를 AsyncStorage에 저장한다(함수 등 상태 외 값은 저장하지 않는다)', async () => {
    useChatQueueStore.getState().addMessage({
      roomId: 1,
      content: '보낼 메시지',
      messageType: 'TEXT',
      imageIds: [],
    });

    const stored = await readStoredQueue();
    expect(Object.keys(stored.state)).toEqual(['pendingMessages']);
    expect(stored.state.pendingMessages).toEqual([
      expect.objectContaining({ content: '보낼 메시지', status: MESSAGE_STATUS.PENDING }),
    ]);
  });

  it('reset(로그아웃)하면 저장소에서도 비운다', async () => {
    useChatQueueStore
      .getState()
      .addMessage({ roomId: 1, content: 'a', messageType: 'TEXT', imageIds: [] });

    useChatQueueStore.getState().reset();

    expect((await readStoredQueue()).state.pendingMessages).toEqual([]);
  });

  describe('앱 재시작 후 복원', () => {
    it('보내지 못한 PENDING·FAILED 메시지는 그대로 복원한다', async () => {
      await writeStoredQueue([
        makePending({ tempId: 'p', status: MESSAGE_STATUS.PENDING }),
        makePending({ tempId: 'f', status: MESSAGE_STATUS.FAILED, retryCount: 2 }),
      ]);

      await useChatQueueStore.persist.rehydrate();

      expect(useChatQueueStore.getState().pendingMessages).toEqual([
        expect.objectContaining({ tempId: 'p', status: MESSAGE_STATUS.PENDING }),
        expect.objectContaining({ tempId: 'f', status: MESSAGE_STATUS.FAILED, retryCount: 2 }),
      ]);
    });

    it('전송 중(SENDING)이던 메시지는 서버 수신 여부를 몰라 자동 재전송하지 않도록 FAILED로 돌린다', async () => {
      await writeStoredQueue([makePending({ tempId: 's', status: MESSAGE_STATUS.SENDING })]);

      await useChatQueueStore.persist.rehydrate();

      expect(useChatQueueStore.getState().pendingMessages[0].status).toBe(MESSAGE_STATUS.FAILED);
    });

    it('사라진 로컬 이미지는 서버 URL로 바꾸고, 서버 URL도 없으면 미리보기에서 뺀다', async () => {
      await writeStoredQueue([
        makePending({
          messageType: 'IMAGE',
          imageIds: [1, 2, 3],
          images: [
            { imageId: 1, imageUrl: 'file:///cache/exists.jpg', remoteUrl: 'https://cdn/1.jpg' },
            { imageId: 2, imageUrl: 'file:///cache/gone.jpg', remoteUrl: 'https://cdn/2.jpg' },
            { imageId: 3, imageUrl: 'file:///cache/gone-too.jpg' },
          ],
        }),
      ]);

      await useChatQueueStore.persist.rehydrate();

      const restored = useChatQueueStore.getState().pendingMessages[0];
      expect(restored.images).toEqual([
        { imageId: 1, imageUrl: 'file:///cache/exists.jpg', remoteUrl: 'https://cdn/1.jpg' },
        { imageId: 2, imageUrl: 'https://cdn/2.jpg', remoteUrl: 'https://cdn/2.jpg' },
      ]);
      // 이미지는 이미 서버에 올라가 있어 전송에는 imageIds만 있으면 된다
      expect(restored.imageIds).toEqual([1, 2, 3]);
    });

    it('미리보기 이미지가 모두 사라지면 images를 비워 imageIds 기반 표시로 돌아간다', async () => {
      await writeStoredQueue([
        makePending({
          messageType: 'IMAGE',
          imageIds: [3],
          images: [{ imageId: 3, imageUrl: 'file:///cache/gone.jpg' }],
        }),
      ]);

      await useChatQueueStore.persist.rehydrate();

      expect(useChatQueueStore.getState().pendingMessages[0].images).toBeUndefined();
    });

    it('복원하는 동안 새로 보낸 메시지는 덮어쓰지 않고 뒤에 이어 붙인다', async () => {
      // setState도 저장소에 쓰므로, 메모리에 새 메시지를 넣은 뒤 저장소를 "지난 실행의 값"으로 되돌린다
      useChatQueueStore.setState({ pendingMessages: [makePending({ tempId: 'new' })] });
      await writeStoredQueue([makePending({ tempId: 'restored' })]);

      await useChatQueueStore.persist.rehydrate();

      expect(useChatQueueStore.getState().pendingMessages.map((m) => m.tempId)).toEqual([
        'restored',
        'new',
      ]);
    });
  });
});
