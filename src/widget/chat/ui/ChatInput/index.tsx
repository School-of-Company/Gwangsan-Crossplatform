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
      <ImagePreview images={chatInput.selectedImages} onRemoveImage={chatInput.removeImage} />

      <View className="flex-row items-center border-t border-gray-200 px-4 py-4">
        <View className="mr-3 min-h-[48px] flex-1 flex-row items-center rounded-full bg-gray-100">
          <TextInput
            value={chatInput.textMessage}
            onChangeText={chatInput.updateMessage}
            placeholder="채팅을 입력해주세요"
            placeholderTextColor="#9CA3AF"
            className="min-h-[48px] flex-1 px-4 py-3 text-base text-gray-900"
            multiline={false}
            onSubmitEditing={chatInput.handleSendMessage}
            editable={!isInputDisabled}
            returnKeyType="send"
            blurOnSubmit={false}
            style={{ textAlignVertical: 'center' }}
          />
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
        </View>
        <TouchableOpacity
          onPress={chatInput.handleSendMessage}
          disabled={!chatInput.canSend}
          className={`h-12 w-12 items-center justify-center rounded-full ${
            chatInput.canSend ? 'bg-orange-400' : 'bg-gray-300'
          }`}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
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
