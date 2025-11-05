export { createChatRoom } from './api/createChatRoom';
export { findChatRoom } from './api/findChatRoom';
export { getChatRooms } from './api/getChatRooms';
export { getChatMessages, getChatRoomData } from './api/getChatMessages';
export { markChatAsRead } from './api/markChatAsRead';

export {
  createChatSocketService,
  type IChatSocketService,
  type ChatSocketEvents,
  type ChatSendMessagePayload,
} from './lib/socketService';

export {
  formatMessageTime,
  renderMessageContent,
  renderMessageImages,
  renderMessageText,
  type MessageRenderConfig,
} from './lib/messageRenderer';

export { useChatRooms, chatRoomKeys } from './model/useChatRooms';
export { useChatMessages, chatMessageKeys, type EnhancedChatMessage } from './model/useChatMessages';
export { useCreateChatRoom } from './model/useCreateChatRoom';
export { useFindChatRoom } from './model/useFindChatRoom';
export { useChatRoomData } from './model/useChatRoomData';
export {
  useImageLoader,
  type UseImageLoaderReturn,
  type ImageLoadingState,
} from './model/useImageLoader';

export { useSocketConnection } from './model/useSocketConnection';
export { useMessageSync } from './model/useMessageSync';
export { useSocketEventHandlers } from './model/useSocketEventHandlers';

export type {
  CreateChatRoomResponse,
  FindChatRoomResponse,
  ChatRoomListItem,
  ChatMessageResponse,
  SendMessagePayload,
  ChatApiError,
  ChatRoomListData,
  ChatMessagesData,
  TradeProduct,
  ChatRoomWithProduct,
} from './model/chatTypes';

export { isChatRoomListItem, isChatMessageResponse } from './model/chatTypes';

export { ChatRoomItem, ChatMessage, TradeEmbed } from './ui';

export { useChatSocket } from './model/useChatSocket';
