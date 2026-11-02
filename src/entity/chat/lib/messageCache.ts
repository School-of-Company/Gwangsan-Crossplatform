import type { MessageId, RoomId } from '@/shared/types/chatType';
import type { ChatMessageResponse } from '../model/chatTypes';

export interface MessageUpdatedPayload {
  readonly roomId: RoomId;
  readonly messageId: MessageId;
  readonly content: string;
  readonly editedAt: string;
}

export interface MessageDeletedPayload {
  readonly roomId: RoomId;
  readonly messageId: MessageId;
}

// 서버·소켓에 따라 messageId가 숫자/문자열로 섞여 올 수 있어 문자열로 비교한다
export const isSameMessageId = (a: MessageId, b: MessageId) => String(a) === String(b);

export const applyMessageUpdate = (
  messages: readonly ChatMessageResponse[] | undefined,
  update: Pick<MessageUpdatedPayload, 'messageId' | 'content' | 'editedAt'>
): ChatMessageResponse[] | undefined => {
  if (!messages) return messages;

  let changed = false;
  const next = messages.map((message) => {
    if (!isSameMessageId(message.messageId, update.messageId)) return message;
    changed = true;
    return { ...message, content: update.content, editedAt: update.editedAt };
  });

  return changed ? next : (messages as ChatMessageResponse[]);
};

export const removeMessageById = (
  messages: readonly ChatMessageResponse[] | undefined,
  messageId: MessageId
): ChatMessageResponse[] | undefined => {
  if (!messages) return messages;

  const next = messages.filter((message) => !isSameMessageId(message.messageId, messageId));
  return next.length === messages.length ? (messages as ChatMessageResponse[]) : next;
};

// ─── 페이지 단위 메시지 캐시(chatMessageKeys.room) ───────────────────────────────
// pages[0]이 최신 페이지이고, 각 페이지의 messages는 오래된 → 최신 순이다.
// nextCursor는 서버에서 받은 시점에 정해 두어, 이후 소켓 이벤트로 페이지 내용이 바뀌어도
// 다음(더 오래된) 페이지 요청 위치가 흔들리지 않게 한다.
export interface ChatMessagePageCursor {
  readonly lastCreatedAt: string;
  readonly lastMessageId: MessageId;
}

export interface ChatMessagePage {
  readonly messages: readonly ChatMessageResponse[];
  readonly nextCursor: ChatMessagePageCursor | null;
}

export interface ChatMessagePages {
  readonly pages: readonly ChatMessagePage[];
  // 첫 페이지는 null, 이후는 ChatMessagePageCursor(React Query의 InfiniteData와 맞추려 unknown)
  readonly pageParams: readonly unknown[];
}

const toTime = (value: string) => {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const sortAscending = (messages: readonly ChatMessageResponse[]) =>
  [...messages].sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));

// 서버 응답(최신순)을 페이지로 만든다. 받은 개수가 limit보다 적으면 더 오래된 메시지가 없다
export const toMessagePage = (
  serverMessages: readonly ChatMessageResponse[],
  limit: number
): ChatMessagePage => {
  const messages = sortAscending(serverMessages);
  const oldest = messages[0];
  return {
    messages,
    nextCursor:
      serverMessages.length >= limit && oldest
        ? { lastCreatedAt: oldest.createdAt, lastMessageId: oldest.messageId }
        : null,
  };
};

export const createMessagePages = (page: ChatMessagePage): ChatMessagePages => ({
  pages: [page],
  pageParams: [null],
});

// 화면에 그릴 전체 메시지(오래된 → 최신). 페이지 경계에서 겹친 메시지는 한 번만 남긴다
export const flattenMessagePages = (data: ChatMessagePages | undefined): ChatMessageResponse[] => {
  if (!data) return [];
  const seen = new Set<string>();
  const result: ChatMessageResponse[] = [];
  [...data.pages].reverse().forEach((page) => {
    page.messages.forEach((message) => {
      const key = String(message.messageId);
      if (seen.has(key)) return;
      seen.add(key);
      result.push(message);
    });
  });
  return result;
};

export const getNewestMessage = (
  data: ChatMessagePages | undefined
): ChatMessageResponse | null => {
  const newestPage = data?.pages[0]?.messages;
  return newestPage && newestPage.length > 0 ? newestPage[newestPage.length - 1] : null;
};

export const hasMessageInPages = (data: ChatMessagePages | undefined, messageId: MessageId) =>
  Boolean(
    data?.pages.some((page) => page.messages.some((m) => isSameMessageId(m.messageId, messageId)))
  );

// 새로 받은 메시지(소켓 수신 등)는 최신 페이지에 넣는다. 이미 어느 페이지에든 있으면 그대로 둔다
export const addMessageToPages = (
  data: ChatMessagePages | undefined,
  message: ChatMessageResponse
): ChatMessagePages => {
  if (!data || data.pages.length === 0) {
    return createMessagePages({ messages: [message], nextCursor: null });
  }
  if (hasMessageInPages(data, message.messageId)) return data;

  const [newestPage, ...olderPages] = data.pages;
  return {
    ...data,
    pages: [
      { ...newestPage, messages: sortAscending([...newestPage.messages, message]) },
      ...olderPages,
    ],
  };
};

// 각 페이지의 메시지 배열에 같은 변환(수정·삭제 반영)을 적용한다. 바뀐 게 없으면 같은 참조를 돌려준다
export const mapMessagePages = (
  data: ChatMessagePages | undefined,
  transform: (
    messages: readonly ChatMessageResponse[]
  ) => readonly ChatMessageResponse[] | undefined
): ChatMessagePages | undefined => {
  if (!data) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    const next = transform(page.messages) ?? page.messages;
    if (next === page.messages) return page;
    changed = true;
    return { ...page, messages: next };
  });
  return changed ? { ...data, pages } : data;
};

// 다시 들어온 방은 첫 페이지만 남겨, 재진입 때 쌓아 둔 모든 페이지를 다시 받지 않게 한다
export const keepNewestPage = (data: ChatMessagePages | undefined) =>
  data && data.pages.length > 1
    ? { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) }
    : data;

// 배열 정렬 방향에 기대지 않고 실제 최신 시각을 구한다 — REST/소켓 배열의 정렬 방향이
// 다를 수 있다(#610). 파싱 불가능한 값은 최신 판정에 끼어들지 않도록 무시한다.
export const getLatestMessageTime = (messages: readonly ChatMessageResponse[]): number =>
  messages.reduce((max, message) => {
    const time = new Date(message.createdAt).getTime();
    return Number.isFinite(time) && time > max ? time : max;
  }, 0);

// 채팅방 진입 전에 받은 REST snapshot(최신 페이지)으로 메시지 캐시를 채운다.
// 서버는 Redis Stream 발행 후 DB에 비동기로 저장하므로, 이 snapshot에는 방금 보낸 메시지가 아직
// 없을 수 있다. 무조건 덮어쓰면 소켓 echo로 이미 반영된 최신 메시지가 재입장 시 일시적으로
// 사라진다(#610) — 기존 캐시와 snapshot 중 최대 createdAt이 더 큰 쪽을 그대로 쓴다.
// 메시지 병합/ID union은 하지 않는다(소켓·REST 간 ID 표현 차이로 중복이 생길 수 있다).
export const seedMessagePagesFromSnapshot = (
  current: ChatMessagePages | undefined,
  snapshotMessages: readonly ChatMessageResponse[],
  limit: number
): ChatMessagePages => {
  const snapshotPages = createMessagePages(toMessagePage(snapshotMessages, limit));
  const currentMessages = flattenMessagePages(current);
  if (!current || currentMessages.length === 0) return snapshotPages;

  return getLatestMessageTime(snapshotMessages) > getLatestMessageTime(currentMessages)
    ? snapshotPages
    : current;
};
