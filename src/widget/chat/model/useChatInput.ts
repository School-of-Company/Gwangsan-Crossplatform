import { useState, useCallback } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
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

  const canSend =
    (textMessage.trim().length > 0 || selectedImages.length > 0) &&
    !disabled &&
    !isUploading &&
    !isSending;

  const updateMessage = useCallback((text: string) => {
    setTextMessage(text);
  }, []);

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

  const pickAndUpload = useCallback(
    async (launchFn: () => Promise<ImagePicker.ImagePickerResult>) => {
      setIsUploading(true);
      try {
        const result = await launchFn();
        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        const uploadedImage = await uploadImage(asset.uri);
        setSelectedImages((prev) => [
          ...prev,
          { imageId: uploadedImage.imageId, imageUrl: uploadedImage.imageUrl, localUri: asset.uri },
        ]);
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadImage]
  );

  const pickFromGallery = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첨부를 위해 사진첩 접근 권한이 필요합니다.');
      return;
    }
    await pickAndUpload(() =>
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      })
    );
  }, [pickAndUpload]);

  const pickFromCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '카메라 사용을 위해 카메라 접근 권한이 필요합니다.');
      return;
    }
    await pickAndUpload(() =>
      ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      })
    );
  }, [pickAndUpload]);

  const handleImagePicker = useCallback(() => {
    if (disabled || isUploading || selectedImages.length >= 5) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['취소', '갤러리에서 선택', '카메라로 촬영'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) pickFromGallery();
          if (buttonIndex === 2) pickFromCamera();
        }
      );
    } else {
      Alert.alert('사진 선택', undefined, [
        { text: '취소', style: 'cancel' },
        { text: '갤러리에서 선택', onPress: pickFromGallery },
        { text: '카메라로 촬영', onPress: pickFromCamera },
      ]);
    }
  }, [disabled, isUploading, selectedImages.length, pickFromGallery, pickFromCamera]);

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

  const resetInput = useCallback(() => {
    setTextMessage('');
    setSelectedImages([]);
    setIsUploading(false);
    setIsSending(false);
  }, []);

  return {
    textMessage,
    selectedImages,
    isUploading,
    isSending,
    canSend,

    updateMessage,
    handleImagePicker,
    removeImage,
    handleSendMessage,
    resetInput,
  };
};
