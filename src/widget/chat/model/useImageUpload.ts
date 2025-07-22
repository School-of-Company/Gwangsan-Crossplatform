import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUploadImage } from '@/shared/model/useUploadImage';

interface UseImageUploadProps {
  onImageUpload: (imageIds: number[], imageInfos?: Array<{ imageId: number; imageUrl: string }>) => void;
  disabled?: boolean;
}

export const useImageUpload = ({ onImageUpload, disabled = false }: UseImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const uploadImageMutation = useUploadImage();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첨부를 위해 사진첩 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  }, []);

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

  const handleImagePicker = useCallback(async () => {
    if (disabled || isUploading) return;

    setIsUploading(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      const selectedImage = await selectImage();
      if (!selectedImage) return;

      const uploadedImage = await uploadImage(selectedImage.uri);
      onImageUpload([uploadedImage.imageId], [uploadedImage]);
    } finally {
      setIsUploading(false);
    }
  }, [disabled, isUploading, requestPermission, selectImage, uploadImage, onImageUpload]);

  return {
    isUploading,
    handleImagePicker,
  };
}; 