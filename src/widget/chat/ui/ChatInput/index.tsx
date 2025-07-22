import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { memo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTextInput } from '../../model/useTextInput';
import { useImageUpload } from '../../model/useImageUpload';

interface ChatInputProps {
  onSendTextMessage: (message: string) => void;
  onSendImageMessage: (
    imageIds: number[],
    imageInfos?: Array<{ imageId: number; imageUrl: string }>
  ) => void;
  disabled?: boolean;
}

const ChatInputComponent = ({
  onSendTextMessage,
  onSendImageMessage,
  disabled,
}: ChatInputProps) => {
  const textInput = useTextInput({
    onSendText: onSendTextMessage,
    disabled,
  });

  const imageUpload = useImageUpload({
    onImageUpload: onSendImageMessage,
    disabled: disabled || textInput.isSending,
  });

  const isInputDisabled = disabled || textInput.isSending || imageUpload.isUploading;
  const canSelectImage = !disabled && !textInput.isSending && !imageUpload.isUploading;

  return (
    <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-3">
      <View className="mr-3 flex-1 flex-row items-center rounded-full bg-gray-100">
        <TextInput
          value={textInput.message}
          onChangeText={textInput.updateMessage}
          placeholder="채팅을 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="flex-1 px-4 py-3 text-base text-gray-900"
          multiline={false}
          onSubmitEditing={textInput.handleSendText}
          editable={!isInputDisabled}
        />
        <TouchableOpacity
          className="mr-3"
          onPress={imageUpload.handleImagePicker}
          disabled={!canSelectImage}>
          {imageUpload.isUploading ? (
            <ActivityIndicator size="small" color="#8F9094" />
          ) : (
            <Icon name="camera-outline" size={24} color={canSelectImage ? '#8F9094' : '#D1D5DB'} />
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={textInput.handleSendText}
        disabled={!textInput.canSendText}
        className={`h-10 w-10 items-center justify-center rounded-full ${
          textInput.canSendText ? 'bg-orange-400' : 'bg-gray-300'
        }`}>
        {textInput.isSending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Icon name="chevron-forward" size={20} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export const ChatInput = memo(ChatInputComponent);
