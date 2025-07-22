import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadImage } from '@/shared/model/useUploadImage';

export interface ImagePreview {
  imageId: number;
  imageUrl: string;
  localUri: string;
}

interface UseChatInputProps {
  onSendMessage: (content: string | null, imageIds: number[]) => void;
  disabled?: boolean;
}

export const useChatInput = ({ onSendMessage, disabled = false }: UseChatInputProps) => {
  const [textMessage, setTextMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const uploadImageMutation = useUploadImage();

  // 전송 가능 여부 체크
  const canSend =
    (textMessage.trim().length > 0 || selectedImages.length > 0) &&
    !disabled &&
    !isUploading &&
    !isSending;

  // 텍스트 업데이트
  const updateMessage = useCallback((text: string) => {
    setTextMessage(text);
  }, []);

  // 이미지 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첨부를 위해 사진첩 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  }, []);

  // 이미지 선택
  const selectImage = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
      return null;
    }
  }, []);

  // 이미지 업로드
  const uploadImage = useCallback(
    async (imageUri: string) => {
      try {
        return await uploadImageMutation.mutateAsync(imageUri);
      } catch (error) {
        console.error(error);
        Alert.alert('오류', '이미지 업로드 중 오류가 발생했습니다.');
        throw error;
      }
    },
    [uploadImageMutation]
  );

  // 이미지 추가
  const handleImagePicker = useCallback(async () => {
    if (disabled || isUploading || selectedImages.length >= 5) return;

    setIsUploading(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const selectedImage = await selectImage();
      if (!selectedImage) return;

      const uploadedImage = await uploadImage(selectedImage.uri);

      const newImagePreview: ImagePreview = {
        imageId: uploadedImage.imageId,
        imageUrl: uploadedImage.imageUrl,
        localUri: selectedImage.uri,
      };

      setSelectedImages((prev) => [...prev, newImagePreview]);
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, selectedImages.length, requestPermission, selectImage, uploadImage]);

  const removeImage = useCallback((imageId: number) => {
    setSelectedImages((prev) => prev.filter((img) => img.imageId !== imageId));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!canSend) return;

    setIsSending(true);

    try {
      const content = textMessage.trim() || null;
      const imageIds = selectedImages.map((img) => img.imageId);

      onSendMessage(content, imageIds);

      setTextMessage('');
      setSelectedImages([]);
    } finally {
      setIsSending(false);
    }
  }, [canSend, textMessage, selectedImages, onSendMessage]);

  // 모든 상태 초기화
  const resetInput = useCallback(() => {
    setTextMessage('');
    setSelectedImages([]);
    setIsUploading(false);
    setIsSending(false);
  }, []);

  return {
    // 상태
    textMessage,
    selectedImages,
    isUploading,
    isSending,
    canSend,

    // 액션
    updateMessage,
    handleImagePicker,
    removeImage,
    handleSendMessage,
    resetInput,
  };
};
