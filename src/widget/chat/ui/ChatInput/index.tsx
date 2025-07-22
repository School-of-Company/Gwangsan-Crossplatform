import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { memo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChatInput } from '../../model/useChatInput';
import { ImagePreview } from '../ImagePreview';

interface ChatInputProps {
  onSendMessage: (content: string | null, imageIds: number[]) => void;
  disabled?: boolean;
}

const ChatInputComponent = ({ onSendMessage, disabled }: ChatInputProps) => {
  const chatInput = useChatInput({
    onSendMessage,
    disabled,
  });

  const isInputDisabled = disabled || chatInput.isSending || chatInput.isUploading;
  const canSelectImage =
    !disabled &&
    !chatInput.isSending &&
    !chatInput.isUploading &&
    chatInput.selectedImages.length < 5;

  return (
    <View className="bg-white">
      {/* 이미지 미리보기 */}
      <ImagePreview images={chatInput.selectedImages} onRemoveImage={chatInput.removeImage} />

      {/* 입력 영역 */}
      <View className="flex-row items-center border-t border-gray-200 px-4 py-3">
        <View className="mr-3 flex-1 flex-row items-center rounded-full bg-gray-100">
          <TextInput
            value={chatInput.textMessage}
            onChangeText={chatInput.updateMessage}
            placeholder="채팅을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-4 py-3 text-base text-gray-900"
            multiline={false}
            onSubmitEditing={chatInput.handleSendMessage}
            editable={!isInputDisabled}
          />
          <TouchableOpacity
            className="mr-3"
            onPress={chatInput.handleImagePicker}
            disabled={!canSelectImage}>
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
        </View>
        <TouchableOpacity
          onPress={chatInput.handleSendMessage}
          disabled={!chatInput.canSend}
          className={`h-10 w-10 items-center justify-center rounded-full ${
            chatInput.canSend ? 'bg-orange-400' : 'bg-gray-300'
          }`}>
          {chatInput.isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon name="chevron-forward" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);
