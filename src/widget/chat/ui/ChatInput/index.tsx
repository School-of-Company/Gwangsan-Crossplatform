import { View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useUploadImage } from '@/shared/model/useUploadImage';

interface ChatInputProps {
  onSendTextMessage: (message: string) => void;
  onSendImageMessage: (
    imageIds: number[],
    imageInfos?: Array<{ imageId: number; imageUrl: string }>
  ) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendTextMessage, onSendImageMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const uploadImageMutation = useUploadImage();

  const handleSendText = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isSendingMessage) {
      setIsSendingMessage(true);
      try {
        onSendTextMessage(trimmedMessage);
        setMessage('');
      } finally {
        setTimeout(() => setIsSendingMessage(false), 1000);
      }
    }
  }, [message, onSendTextMessage, disabled, isSendingMessage]);

  const handleImagePicker = useCallback(async () => {
    if (disabled || isUploadingImage || isSendingMessage) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첨부를 위해 사진첩 접근 권한이 필요합니다.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingImage(true);
        const imageUri = result.assets[0].uri;

        try {
          const uploadedImage = await uploadImageMutation.mutateAsync(imageUri);
          onSendImageMessage([uploadedImage.imageId], [uploadedImage]);
        } catch (error) {
          console.error('이미지 업로드 중 오류:', error);
          Alert.alert('오류', '이미지 업로드 중 오류가 발생했습니다.');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('이미지 선택 중 오류:', error);
      setIsUploadingImage(false);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  }, [disabled, isUploadingImage, isSendingMessage, uploadImageMutation, onSendImageMessage]);

  const canSendText =
    message.trim().length > 0 && !disabled && !isUploadingImage && !isSendingMessage;
  const canSelectImage = !disabled && !isUploadingImage && !isSendingMessage;

  return (
    <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-3">
      <View className="mr-3 flex-1 flex-row items-center rounded-full bg-gray-100">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="채팅을 입력해주세요"
          placeholderTextColor="#9CA3AF"
          className="flex-1 px-4 py-3 text-base text-gray-900"
          multiline={false}
          onSubmitEditing={handleSendText}
          editable={!disabled && !isUploadingImage && !isSendingMessage}
        />
        <TouchableOpacity className="mr-3" onPress={handleImagePicker} disabled={!canSelectImage}>
          {isUploadingImage ? (
            <ActivityIndicator size="small" color="#8F9094" />
          ) : (
            <Icon name="camera-outline" size={24} color={canSelectImage ? '#8F9094' : '#D1D5DB'} />
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleSendText}
        disabled={!canSendText}
        className={`h-10 w-10 items-center justify-center rounded-full ${
          canSendText ? 'bg-orange-400' : 'bg-gray-300'
        }`}>
        {isSendingMessage ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Icon name="chevron-forward" size={20} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}
