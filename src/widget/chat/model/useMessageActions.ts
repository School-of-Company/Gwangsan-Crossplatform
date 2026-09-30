import { useCallback, useState } from 'react';
import {
  canEditMessage,
  canModifyMessage,
  useDeleteChatMessage,
  useUpdateChatMessage,
  type EnhancedChatMessage,
} from '~/entity/chat';
import type { MessageId, RoomId } from '~/shared/types/chatType';

// 꾹 누른 말풍선의 화면상 위치. 메뉴에서 이 자리에 말풍선을 그대로 띄워 강조한다
export interface MessageAnchor {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface MessageMenu {
  readonly message: EnhancedChatMessage;
  readonly anchor: MessageAnchor;
  // 이미지 메시지는 삭제만 할 수 있다
  readonly canEdit: boolean;
}

export interface EditingMessage {
  readonly messageId: MessageId;
  readonly content: string;
}

// 내 메시지를 길게 눌렀을 때의 수정/삭제 메뉴, 입력창 수정 모드, 삭제 확인 상태를 관리한다.
// 메뉴는 OS 기본 ActionSheet 대신 화면 전체를 블러 처리하고 누른 말풍선만 강조하는 자체 화면
// (MessageActionOverlay)으로 띄운다
export const useMessageActions = (roomId: RoomId) => {
  const [menu, setMenu] = useState<MessageMenu | null>(null);
  const [editingMessage, setEditingMessage] = useState<EditingMessage | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<MessageId | null>(null);

  const updateMutation = useUpdateChatMessage(roomId);
  const deleteMutation = useDeleteChatMessage(roomId);

  const startEdit = useCallback((message: EnhancedChatMessage) => {
    setEditingMessage({ messageId: message.messageId, content: message.content ?? '' });
  }, []);

  const requestDelete = useCallback((message: EnhancedChatMessage) => {
    setDeleteTargetId(message.messageId);
  }, []);

  const openMessageMenu = useCallback((message: EnhancedChatMessage, anchor: MessageAnchor) => {
    // 메뉴가 뜬 뒤 24시간이 지나는 경우까지 다시 한 번 확인한다
    if (!canModifyMessage(message)) return;
    setMenu({ message, anchor, canEdit: canEditMessage(message) });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const selectEdit = useCallback(() => {
    if (!menu?.canEdit) return;
    startEdit(menu.message);
    setMenu(null);
  }, [menu, startEdit]);

  const selectDelete = useCallback(() => {
    if (!menu) return;
    requestDelete(menu.message);
    setMenu(null);
  }, [menu, requestDelete]);

  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const submitEdit = useCallback(
    (content: string) => {
      if (!editingMessage) return;

      const trimmed = content.trim();
      setEditingMessage(null);
      // 내용이 비었거나 바뀌지 않았으면 서버에 보내지 않고 수정 모드만 끝낸다
      if (!trimmed || trimmed === editingMessage.content.trim()) return;

      updateMutation.mutate({ messageId: editingMessage.messageId, content: trimmed });
    },
    [editingMessage, updateMutation]
  );

  const cancelDelete = useCallback(() => {
    setDeleteTargetId(null);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTargetId === null) return;

    if (editingMessage?.messageId === deleteTargetId) setEditingMessage(null);
    deleteMutation.mutate(deleteTargetId);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteMutation, editingMessage]);

  return {
    menu,
    closeMenu,
    selectEdit,
    selectDelete,
    editingMessage,
    isDeleteConfirmVisible: deleteTargetId !== null,
    openMessageMenu,
    cancelEdit,
    submitEdit,
    cancelDelete,
    confirmDelete,
  };
};
