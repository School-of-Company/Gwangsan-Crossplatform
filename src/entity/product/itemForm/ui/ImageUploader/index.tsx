import { View, TouchableOpacity, Image, Alert, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { memo, useState } from 'react';
import { useUploadImage } from '@/shared/model/useUploadImage';
import { ImageType } from '@/shared/types/imageType';

interface Props {
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  onImageIdsChange?: (imageIds: number[]) => void;
  readonly?: boolean;
}

const ImageUploader = ({
  images = [],
  onImagesChange,
  onImageIdsChange,
  readonly = false,
}: Props) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ImageType[]>([]);

  const uploadImageMutation = useUploadImage();

  const pickImage = async () => {
    if (readonly) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;

        const newImages = [...images, newImageUri];
        onImagesChange?.(newImages);

        setUploadingIndex(newImages.length - 1);

        const uploadedImage = await uploadImageMutation.mutateAsync(newImageUri);

        const newUploadedImages = [...uploadedImages, uploadedImage];
        setUploadedImages(newUploadedImages);

        if (onImageIdsChange) {
          const imageIds = newUploadedImages.map((img) => img.imageId);
          onImageIdsChange(imageIds);
        }

        setUploadingIndex(null);
      }
    } catch (error) {
      console.error('이미지 선택 또는 업로드 중 오류:', error);

      if (uploadingIndex !== null) {
        const newImages = images.filter((_, i) => i !== uploadingIndex);
        onImagesChange?.(newImages);
        setUploadingIndex(null);
      }
    }
  };

  const removeImage = (index: number) => {
    if (readonly) return;

    Alert.alert('이미지 삭제', '이 이미지를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const newImages = images.filter((_, i) => i !== index);
          onImagesChange?.(newImages);

          const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
          setUploadedImages(newUploadedImages);

          if (onImageIdsChange) {
            const imageIds = newUploadedImages.map((img) => img.imageId);
            onImageIdsChange(imageIds);
          }
        },
      },
    ]);
  };

  return (
    <View>
      <Text className="mb-2 text-lg text-black">사진첨부</Text>
      <View className="flex-row flex-wrap items-center gap-3">
        {images.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            onLongPress={() => removeImage(idx)}
            disabled={readonly || idx === uploadingIndex}
            className="relative h-12 w-12">
            <Image source={{ uri }} className="h-12 w-12 rounded-full" />
            {idx === uploadingIndex && (
              <View className="absolute inset-0 items-center justify-center rounded-full bg-black/30">
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}
          </TouchableOpacity>
        ))}
        {!readonly && images.length < 10 && (
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploadingIndex !== null}
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Icon name="add" size={24} color={uploadingIndex !== null ? '#999' : '#111'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(ImageUploader);
