import {
  formatMessageTime,
  getMessageDateKey,
  formatDateDividerLabel,
  isSystemMessage,
} from '~/entity/chat';
import type { EnhancedChatMessage, TradeProduct } from '~/entity/chat';

export interface TradeEmbedConfig {
  readonly shouldShow: boolean;
  readonly product?: TradeProduct | null;
  readonly showButtons: boolean;
  readonly otherPartyNickname: string;
  readonly reserverNickname?: string;
  readonly onOpenReservationModal?: () => void;
  readonly onOpenMap?: () => void;
}

type ResolvedTradeEmbed = Omit<TradeEmbedConfig, 'product'> & {
  readonly product: TradeProduct;
};

interface ResolvedTradeCompletedEmbed {
  readonly productId: number;
  readonly alignment: 'left' | 'right';
  readonly hasReviewed: boolean;
}

interface ResolvedTradeReservedEmbed {
  readonly productId: number;
  readonly alignment: 'left' | 'right';
  readonly scheduledAt?: string | null;
  readonly placeName?: string | null;
  readonly reserverNickname?: string;
  readonly onOpenMap?: () => void;
}

// 말풍선 묶음·시간 표시는 이웃 메시지에 따라 정해지므로 목록 데이터를 만들 때 미리 계산해 둔다.
// renderItem이 목록 전체(이웃)를 참조하지 않아야 메시지 하나가 추가될 때 모든 행이 다시 그려지지 않는다
export interface MessageDisplay {
  readonly isLastMine: boolean;
  readonly isFollowedByGrouped: boolean;
  readonly showTime: boolean;
  readonly showProfile: boolean;
}

export type ChatListItem =
  | {
      readonly type: 'message';
      readonly timestamp: string;
      readonly data: EnhancedChatMessage;
      readonly display?: MessageDisplay;
    }
  | { readonly type: 'trade'; readonly timestamp: string; readonly data: ResolvedTradeEmbed }
  | {
      readonly type: 'tradeReserved';
      readonly timestamp: string;
      readonly data: ResolvedTradeReservedEmbed;
    }
  | {
      readonly type: 'tradeCompleted';
      readonly timestamp: string;
      readonly data: ResolvedTradeCompletedEmbed;
    }
  | {
      readonly type: 'system';
      readonly timestamp: string;
      readonly data: {
        readonly messageId: EnhancedChatMessage['messageId'];
        readonly label: string;
      };
    }
  | {
      readonly type: 'dateDivider';
      readonly timestamp: string;
      readonly data: { readonly label: string };
    };

// WS 메시지는 UTC(Z 접미사), REST 메시지는 로컬 오프셋 없는 문자열이라 raw string 비교로는
// 정렬 순서가 뒤집힐 수 있다 — items 정렬(useChatMessages.ts)과 동일하게 epoch 기준으로 비교해,
// 자기보다 늦은 첫 항목 앞에 끼워 넣는다. 시각을 읽을 수 없으면 맨 끝에 붙인다
const insertByTimestamp = (items: ChatListItem[], item: ChatListItem): void => {
  const targetMs = new Date(item.timestamp).getTime();
  const insertAt = Number.isNaN(targetMs)
    ? -1
    : items.findIndex((candidate) => {
        const candidateMs = new Date(candidate.timestamp).getTime();
        return !Number.isNaN(candidateMs) && candidateMs > targetMs;
      });
  items.splice(insertAt < 0 ? items.length : insertAt, 0, item);
};

const hasValidTimestamp = (value: string | null | undefined): value is string =>
  Boolean(value) && !Number.isNaN(new Date(value as string).getTime());

export const DEFAULT_MESSAGE_DISPLAY: MessageDisplay = {
  isLastMine: false,
  isFollowedByGrouped: false,
  showTime: true,
  showProfile: true,
};

// previous/next는 시간순(오래된 → 최신) 기준 이웃이다
const getMessageDisplay = (
  message: EnhancedChatMessage,
  previousItem: ChatListItem | undefined,
  nextItem: ChatListItem | undefined,
  lastMyMessageId: EnhancedChatMessage['messageId'] | null
): MessageDisplay => {
  // 다음 메시지와 시간(분 단위)이 같으면 현재 메시지의 시간 표시는 숨기고 아래쪽에만 노출한다
  const hasSameTimeAsNext =
    nextItem?.type === 'message' &&
    formatMessageTime(nextItem.data.createdAt) === formatMessageTime(message.createdAt);

  if (message.isMine) {
    // 다음 메시지도 내가 연달아 보낸 것이면, '나와 다음 메시지 사이' 간격을 좁힌다
    const isFollowedByGrouped = nextItem?.type === 'message' && nextItem.data.isMine;
    return {
      isLastMine: message.messageId === lastMyMessageId,
      isFollowedByGrouped,
      showTime: !(isFollowedByGrouped && hasSameTimeAsNext),
      showProfile: false,
    };
  }

  const isSameSenderContinuation = (candidate: ChatListItem | undefined) =>
    candidate?.type === 'message' &&
    !candidate.data.isMine &&
    candidate.data.senderId === message.senderId;

  // 프로필/닉네임 노출 여부는 '이전' 메시지 기준, 간격은 '다음' 메시지 기준으로 판단한다
  const isFollowedByGrouped = isSameSenderContinuation(nextItem);
  return {
    isLastMine: false,
    isFollowedByGrouped,
    showTime: !(isFollowedByGrouped && hasSameTimeAsNext),
    showProfile: !isSameSenderContinuation(previousItem),
  };
};

interface BuildChatListItemsParams {
  readonly messages: readonly EnhancedChatMessage[];
  readonly tradeEmbedConfig?: TradeEmbedConfig;
  readonly showReviewButton?: boolean;
  readonly hasReviewedTrade?: boolean;
}

// 메시지·거래 카드·날짜 구분선을 시간순으로 합친 뒤, inverted 목록용으로 최신 항목이 앞에 오게 반환한다
export const buildChatListItems = ({
  messages,
  tradeEmbedConfig,
  showReviewButton,
  hasReviewedTrade,
}: BuildChatListItemsParams): ChatListItem[] => {
  const lastMyMessage = [...messages]
    .reverse()
    .find((message) => message.isMine && !isSystemMessage(message));
  const lastMyMessageId = lastMyMessage?.messageId ?? null;

  // SYSTEM 메시지(예: 예약 취소 안내)는 말풍선이 아니라 가운데 글씨 항목으로 따로 만들어,
  // 프로필·연속 발신자 묶음·수정/삭제 판단이 모두 'message' 항목만 보도록 한다
  const items: ChatListItem[] = messages.map((message) =>
    isSystemMessage(message)
      ? {
          type: 'system',
          timestamp: message.createdAt,
          data: { messageId: message.messageId, label: message.content ?? '' },
        }
      : {
          type: 'message',
          timestamp: message.createdAt,
          data: message,
        }
  );

  const product = tradeEmbedConfig?.product;
  if (tradeEmbedConfig?.shouldShow && product?.createdAt) {
    const tradeItem: ChatListItem = {
      type: 'trade',
      timestamp: product.createdAt,
      // 요청/수신 방향(왼쪽·오른쪽, 문구)은 언제든 false로 뒤집힐 수 있는 isCompletable이 아니라
      // 완료 후에도 값이 그대로인 isSeller로 고정해야, 거래가 완료돼도 기존 카드가 반대편으로
      // 뒤집히지 않는다
      data: { ...tradeEmbedConfig, showButtons: product.isSeller } as ResolvedTradeEmbed,
    };

    insertByTimestamp(items, tradeItem);
  }

  // 게시글 작성자는 거래 요청 없이도 바로 예약할 수 있으므로, 예약·완료 카드는 거래 요청
  // 카드 유무와 상관없이 product 상태만 보고 그린다
  if (product) {
    // 서버가 예약/완료 시각(reservedAt/completedAt, Gwangsan-Server#426)을 주면 거래 요청 카드처럼
    // 그 시각으로 메시지 사이에 끼워 넣는다. 구버전 서버라 시각이 없으면 두 시점 모두 지금까지의
    // 대화 중 가장 최근이라고 보고 목록 맨 끝에 붙인다
    const appendTrailingTimestamp = () => {
      const lastItem = items[items.length - 1];
      const lastMs = lastItem ? new Date(lastItem.timestamp).getTime() : NaN;
      if (!Number.isNaN(lastMs)) return new Date(lastMs + 1).toISOString();
      return hasValidTimestamp(product.createdAt) ? product.createdAt : new Date().toISOString();
    };

    const placeTradeCard = (
      serverTimestamp: string | null | undefined,
      build: (timestamp: string) => ChatListItem
    ) => {
      if (hasValidTimestamp(serverTimestamp)) {
        insertByTimestamp(items, build(serverTimestamp));
      } else {
        items.push(build(appendTrailingTimestamp()));
      }
    };

    if (!product.isCompleted && product.isReserved) {
      placeTradeCard(product.reservedAt, (timestamp) => ({
        type: 'tradeReserved',
        timestamp,
        data: {
          productId: product.id,
          alignment: product.isSeller ? 'left' : 'right',
          scheduledAt: product.reservationScheduledAt,
          placeName: product.reservationPlaceName,
          reserverNickname: tradeEmbedConfig?.reserverNickname,
          onOpenMap: tradeEmbedConfig?.onOpenMap,
        },
      }));
    }

    if (showReviewButton && product.isCompleted) {
      placeTradeCard(product.completedAt, (timestamp) => ({
        type: 'tradeCompleted',
        timestamp,
        data: {
          productId: product.id,
          alignment: product.isSeller ? 'left' : 'right',
          hasReviewed: Boolean(hasReviewedTrade),
        },
      }));
    }
  }

  // 날짜가 바뀌는 경계마다 구분선을 끼워 넣는다 — 이전 날짜 문구는 그대로 두고, 새 날짜는 그 아래에 추가된다
  const itemsWithDateDividers: ChatListItem[] = [];
  let lastDateKey: string | null = null;

  items.forEach((item) => {
    const dateKey = getMessageDateKey(item.timestamp);
    if (dateKey !== lastDateKey) {
      itemsWithDateDividers.push({
        type: 'dateDivider',
        timestamp: item.timestamp,
        data: { label: formatDateDividerLabel(item.timestamp) },
      });
      lastDateKey = dateKey;
    }
    itemsWithDateDividers.push(item);
  });

  const withDisplay = itemsWithDateDividers.map((item, index) =>
    item.type === 'message'
      ? {
          ...item,
          display: getMessageDisplay(
            item.data,
            itemsWithDateDividers[index - 1],
            itemsWithDateDividers[index + 1],
            lastMyMessageId
          ),
        }
      : item
  );

  // inverted 목록은 0번이 화면 맨 아래에 그려지므로 최신 항목이 앞에 오도록 뒤집는다
  return withDisplay.reverse();
};
