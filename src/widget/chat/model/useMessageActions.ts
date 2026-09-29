import { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import {
  canEditMessage,
  canModifyMessage,
  useDeleteChatMessage,
  useUpdateChatMessage,
  type EnhancedChatMessage,
} from '~/entity/chat';
import type { MessageId, RoomId } from '~/shared/types/chatType';

export interface EditingMessage {
  readonly messageId: MessageId;
  readonly content: string;
}

const MENU_EDIT = '수정';
const MENU_DELETE = '삭제';
const MENU_CANCEL = '취소';

// 내 메시지를 길게 눌렀을 때의 수정/삭제 메뉴, 입력창 수정 모드, 삭제 확인 상태를 관리한다
export const useMessageActions = (roomId: RoomId) => {
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

  const openMessageMenu = useCallback(
    (message: EnhancedChatMessage) => {
      // 메뉴가 뜬 뒤 24시간이 지나는 경우까지 다시 한 번 확인한다
      if (!canModifyMessage(message)) return;

      const isEditable = canEditMessage(message);
      const actions = isEditable ? [MENU_EDIT, MENU_DELETE] : [MENU_DELETE];

      const handleAction = (action: string) => {
        if (action === MENU_EDIT) startEdit(message);
        if (action === MENU_DELETE) requestDelete(message);
      };

      if (Platform.OS === 'ios') {
        const options = [MENU_CANCEL, ...actions];
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: 0,
            destructiveButtonIndex: options.indexOf(MENU_DELETE),
          },
          (buttonIndex) => {
            const action = options[buttonIndex];
            if (action) handleAction(action);
          }
        );
        return;
      }

      Alert.alert('메시지', undefined, [
        { text: MENU_CANCEL, style: 'cancel' },
        ...actions.map((action) => ({
          text: action,
          style: action === MENU_DELETE ? ('destructive' as const) : ('default' as const),
          onPress: () => handleAction(action),
        })),
      ]);
    },
    [startEdit, requestDelete]
  );

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
    editingMessage,
    isDeleteConfirmVisible: deleteTargetId !== null,
    openMessageMenu,
    cancelEdit,
    submitEdit,
    cancelDelete,
    confirmDelete,
  };
};
