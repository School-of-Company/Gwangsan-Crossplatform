import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { memo, useState } from 'react';
import Icon from '@expo/vector-icons/Ionicons';
import { AlertModal } from '~/shared/ui/AlertModal';
import { useChatInput } from '../../model/useChatInput';
import { ImagePreview } from '../ImagePreview';
import type { EditingMessage } from '../../model/useMessageActions';

interface ChatInputProps {
  onSendMessage: (
    content: string | null,
    imageIds: number[],
    images?: { imageId: number; imageUrl: string }[]
  ) => void;
  disabled?: boolean;
  onFocus?: () => void;
  // 수정 중인 메시지가 있으면 입력창이 수정 모드로 바뀐다
  editingMessage?: EditingMessage | null;
  onSubmitEdit?: (content: string) => void;
  onCancelEdit?: () => void;
}

const ChatInputComponent = ({
  onSendMessage,
  disabled,
  onFocus,
  editingMessage = null,
  onSubmitEdit,
  onCancelEdit,
}: ChatInputProps) => {
  const chatInput = useChatInput({
    onSendMessage,
    disabled,
  });

  // 수정할 메시지가 바뀌면 입력창을 그 내용으로 채우고, 수정 모드가 끝나면 비운다
  const [syncedEditingId, setSyncedEditingId] = useState<EditingMessage['messageId'] | null>(null);
  if ((editingMessage?.messageId ?? null) !== syncedEditingId) {
    setSyncedEditingId(editingMessage?.messageId ?? null);
    chatInput.updateMessage(editingMessage?.content ?? '');
  }

  const isEditing = editingMessage !== null;
  const canSubmitEdit = isEditing && !disabled && chatInput.textMessage.trim().length > 0;
  const canSend = isEditing ? canSubmitEdit : chatInput.canSend;

  const handleSend = () => {
    if (!isEditing) {
      chatInput.handleSendMessage();
      return;
    }
    if (canSubmitEdit) onSubmitEdit?.(chatInput.textMessage);
  };

  const isInputDisabled = disabled || chatInput.isSending || chatInput.isUploading;
  const canSelectImage =
    !disabled &&
    !chatInput.isSending &&
    !chatInput.isUploading &&
    chatInput.selectedImages.length < 5;

  return (
    <View className="bg-white">
      {isEditing ? (
        <View
          testID="chat-input-editing-banner"
          className="flex-row items-center justify-between border-t border-gray-200 px-4 pt-3">
          <View className="flex-row items-center gap-1.5">
            <Icon name="create-outline" size={16} color="#8F9094" />
            <Text className="text-label text-gray-700">메시지 수정 중</Text>
          </View>
          <TouchableOpacity
            testID="chat-input-cancel-edit"
            onPress={onCancelEdit}
            accessibilityLabel="메시지 수정 취소"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close" size={20} color="#8F9094" />
          </TouchableOpacity>
        </View>
      ) : (
        <ImagePreview images={chatInput.selectedImages} onRemoveImage={chatInput.removeImage} />
      )}

      <View
        className={`flex-row items-center px-4 py-4 ${isEditing ? '' : 'border-t border-gray-200'}`}>
        <View className="mr-3 min-h-[48px] flex-1 flex-row items-center rounded-full bg-gray-100">
          <TextInput
            value={chatInput.textMessage}
            onChangeText={chatInput.updateMessage}
            placeholder="채팅을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="min-h-[48px] flex-1 px-4 py-3 text-base text-gray-900"
            multiline={false}
            onSubmitEditing={handleSend}
            onFocus={onFocus}
            editable={!isInputDisabled}
            returnKeyType="send"
            blurOnSubmit={false}
            style={{ textAlignVertical: 'center' }}
          />
          {/* 수정은 텍스트만 가능하므로 수정 모드에서는 사진 첨부를 숨긴다 */}
          {!isEditing && (
            <TouchableOpacity
              className="mr-3 p-2"
              onPress={chatInput.handleImagePicker}
              disabled={!canSelectImage}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {chatInput.isUploading ? (
                <ActivityIndicator size="small" color="#8F9094" />
              ) : (
                <Icon
                  name="camera-outline"
                  size={24}
                  color={canSelectImage ? '#8F9094' : '#D1D5DB'}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          testID="chat-input-send"
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel={isEditing ? '메시지 수정 완료' : '메시지 보내기'}
          className={`h-12 w-12 items-center justify-center rounded-full ${
            canSend ? 'bg-orange-400' : 'bg-gray-300'
          }`}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
          {chatInput.isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name={isEditing ? 'checkmark' : 'chevron-forward'} size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <AlertModal
        isVisible={chatInput.permissionAlertMessage !== null}
        message={`권한 필요\n${chatInput.permissionAlertMessage ?? ''}`}
        confirmText="확인"
        onConfirm={chatInput.closePermissionAlert}
      />

      <AlertModal
        isVisible={chatInput.isUploadErrorAlertVisible}
        message={'오류\n이미지 업로드 중 오류가 발생했습니다.'}
        confirmText="확인"
        onConfirm={chatInput.closeUploadErrorAlert}
      />
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);
