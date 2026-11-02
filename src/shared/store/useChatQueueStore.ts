import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import type { RoomId, SendableMessageType } from '~/shared/types/chatType';

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
} as const;

export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

export interface PendingMessageImage {
  imageId: number;
  imageUrl: string;
  /** 업로드된 이미지의 서버 URL. 앱 재시작 후 로컬 파일(imageUrl)이 사라졌을 때 미리보기로 쓴다 */
  remoteUrl?: string;
}

export interface PendingMessage {
  tempId: string;
  roomId: RoomId;
  content: string | null;
  messageType: SendableMessageType;
  imageIds: number[];
  /** 서버 echo를 기다리지 않고 바로 미리보기를 그리기 위한 로컬 이미지(localUri 등) */
  images?: PendingMessageImage[];
  status: MessageStatus;
  createdAt: string;
  retryCount: number;
}

interface ChatQueueState {
  pendingMessages: PendingMessage[];
  addMessage: (
    message: Omit<PendingMessage, 'tempId' | 'status' | 'createdAt' | 'retryCount'>
  ) => string;
  setStatus: (tempId: string, status: MessageStatus) => void;
  removeMessage: (tempId: string) => void;
  retry: (tempId: string) => void;
  getByRoom: (roomId: RoomId) => PendingMessage[];
  getRetryable: (roomId: RoomId) => PendingMessage[];
  reset: () => void;
}

const uuid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const CHAT_QUEUE_STORAGE_KEY = 'chat-queue';

const isLocalFileUri = (uri: string) => uri.startsWith('file://');

const localFileExists = (uri: string) => {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
};

// 앱을 다시 켰을 때 ImagePicker 캐시 같은 로컬 파일은 OS가 지웠을 수 있다. 이미지 자체는 이미 서버에
// 올라가 있어(imageIds) 전송에는 문제가 없으므로, 미리보기만 서버 URL로 바꾸거나 빼 둔다
const restoreImages = (images: PendingMessageImage[] | undefined) => {
  if (!images) return images;
  const restored = images.flatMap((image) => {
    if (!isLocalFileUri(image.imageUrl) || localFileExists(image.imageUrl)) return [image];
    return image.remoteUrl ? [{ ...image, imageUrl: image.remoteUrl }] : [];
  });
  return restored.length > 0 ? restored : undefined;
};

// 전송 중(SENDING)에 앱이 꺼졌다면 서버가 받았는지 알 수 없다. 자동으로 다시 보내면 중복될 수 있어
// 실패로 돌려 사용자가 재시도하게 한다. 아직 보내지 못한 PENDING은 그대로 두어 연결되면 다시 보낸다
export const restorePendingMessage = (message: PendingMessage): PendingMessage => ({
  ...message,
  status: message.status === MESSAGE_STATUS.SENDING ? MESSAGE_STATUS.FAILED : message.status,
  images: restoreImages(message.images),
});

export const useChatQueueStore = create<ChatQueueState>()(
  persist(
    (set, get) => ({
      pendingMessages: [],

      addMessage: (message) => {
        const tempId = uuid();
        const newMessage: PendingMessage = {
          ...message,
          tempId,
          status: MESSAGE_STATUS.PENDING,
          createdAt: new Date().toISOString(),
          retryCount: 0,
        };

        set((state) => ({ pendingMessages: [...state.pendingMessages, newMessage] }));
        return tempId;
      },

      setStatus: (tempId, status) => {
        set((state) => ({
          pendingMessages: state.pendingMessages.map((msg) =>
            msg.tempId === tempId ? { ...msg, status } : msg
          ),
        }));
      },

      removeMessage: (tempId) => {
        set((state) => ({
          pendingMessages: state.pendingMessages.filter((msg) => msg.tempId !== tempId),
        }));
      },

      retry: (tempId) => {
        set((state) => ({
          pendingMessages: state.pendingMessages.map((msg) =>
            msg.tempId === tempId
              ? { ...msg, retryCount: msg.retryCount + 1, status: MESSAGE_STATUS.PENDING }
              : msg
          ),
        }));
      },

      getByRoom: (roomId) => {
        return get().pendingMessages.filter((msg) => msg.roomId === roomId);
      },

      getRetryable: (roomId) => {
        return get().pendingMessages.filter(
          (msg) =>
            msg.roomId === roomId &&
            (msg.status === MESSAGE_STATUS.PENDING || msg.status === MESSAGE_STATUS.FAILED)
        );
      },

      // 로그아웃 시 이전 계정의 전송 대기·실패 메시지가 다음 계정에 남지 않도록 비운다(#737)
      reset: () => set({ pendingMessages: [] }),
    }),
    {
      name: CHAT_QUEUE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pendingMessages: state.pendingMessages }),
      // 저장소를 읽어오는 동안 새로 보낸 메시지가 덮어써지지 않도록 복원한 메시지 뒤에 이어 붙인다
      merge: (persisted, current) => {
        const restored = (
          (persisted as Partial<ChatQueueState> | undefined)?.pendingMessages ?? []
        ).map(restorePendingMessage);
        const restoredIds = new Set(restored.map((message) => message.tempId));
        return {
          ...current,
          pendingMessages: [
            ...restored,
            ...current.pendingMessages.filter((message) => !restoredIds.has(message.tempId)),
          ],
        };
      },
    }
  )
);
