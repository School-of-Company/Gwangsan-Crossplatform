import { View, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useUploadImage } from '@/shared/model/useUploadImage';
import { ImageType } from '@/shared/types/imageType';
import Toast from 'react-native-toast-message';

export interface ImageUploadState {
  readonly totalImages: number;
  readonly uploadingCount: number;
  readonly uploadedCount: number;
  readonly hasUploadingImages: boolean;
  readonly hasFailedImages: boolean;
}

interface Props {
  images?: string[];
  onImagesChange?: (images: string[]) => void;
  onImageIdsChange?: (imageIds: number[]) => void;
  onUploadStateChange?: (state: ImageUploadState) => void;
  readonly?: boolean;
  title?: string;
  maxImages?: number;
}

interface ImageStatus {
  uri: string;
  status: 'uploading' | 'uploaded' | 'failed';
  imageData?: ImageType;
  error?: Error;
}

const ImageUploader = ({
  images = [],
  onImagesChange,
  onImageIdsChange,
  onUploadStateChange,
  title = '사진첨부',
  readonly = false,
  maxImages = 5,
}: Props) => {
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([]);
  const uploadImageMutation = useUploadImage();

  const uploadState = useMemo((): ImageUploadState => {
    const uploadingCount = imageStatuses.filter((status) => status.status === 'uploading').length;
    const uploadedCount = imageStatuses.filter((status) => status.status === 'uploaded').length;
    const failedCount = imageStatuses.filter((status) => status.status === 'failed').length;

    return {
      totalImages: images.length,
      uploadingCount,
      uploadedCount,
      hasUploadingImages: uploadingCount > 0,
      hasFailedImages: failedCount > 0,
    };
  }, [images.length, imageStatuses]);

  useEffect(() => {
    onUploadStateChange?.(uploadState);
  }, [uploadState, onUploadStateChange]);

  const updateImageStatus = useCallback((uri: string, status: Partial<ImageStatus>) => {
    setImageStatuses((prev) =>
      prev.map((item) => (item.uri === uri ? { ...item, ...status } : item))
    );
  }, []);

  const removeImageByUri = useCallback(
    (uri: string) => {
      const imageIndex = images.indexOf(uri);
      if (imageIndex === -1) return;

      const newImages = images.filter((img) => img !== uri);
      onImagesChange?.(newImages);

      setImageStatuses((prev) => prev.filter((item) => item.uri !== uri));

      const uploadedStatuses = imageStatuses.filter(
        (status) => status.uri !== uri && status.status === 'uploaded' && status.imageData
      );
      const imageIds = uploadedStatuses.map((status) => status.imageData!.imageId);
      onImageIdsChange?.(imageIds);
    },
    [images, imageStatuses, onImagesChange, onImageIdsChange]
  );

  const pickImage = useCallback(async () => {
    if (readonly || images.length >= maxImages) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: 'error',
        text1: '권한 필요',
        text2: '차일 접근 권한이 필요합니다.',
      });
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

        const newStatus: ImageStatus = {
          uri: newImageUri,
          status: 'uploading',
        };
        setImageStatuses((prev) => [...prev, newStatus]);

        try {
          const uploadedImage = await uploadImageMutation.mutateAsync(newImageUri);

          updateImageStatus(newImageUri, {
            status: 'uploaded',
            imageData: uploadedImage,
          });

          const allUploadedStatuses = imageStatuses.filter(
            (s) => s.status === 'uploaded' && s.imageData
          );
          const updatedStatuses = [
            ...allUploadedStatuses,
            { ...newStatus, status: 'uploaded' as const, imageData: uploadedImage },
          ];
          const imageIds = updatedStatuses.map((status) => status.imageData!.imageId);
          onImageIdsChange?.(imageIds);
        } catch (error) {
          console.error(error);
          updateImageStatus(newImageUri, {
            status: 'failed',
            error: error instanceof Error ? error : new Error('업로드 실패'),
          });

          setTimeout(() => {
            removeImageByUri(newImageUri);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('이미지 선택 중 오류:', error);
    }
  }, [
    images,
    maxImages,
    readonly,
    onImagesChange,
    imageStatuses,
    uploadImageMutation,
    updateImageStatus,
    removeImageByUri,
    onImageIdsChange,
  ]);

  const removeImage = useCallback(
    (index: number) => {
      if (readonly) return;

      const imageUri = images[index];
      if (!imageUri) return;

      removeImageByUri(imageUri);
    },
    [images, readonly, removeImageByUri]
  );

  const getImageStatus = useCallback(
    (uri: string): ImageStatus | undefined => {
      return imageStatuses.find((status) => status.uri === uri);
    },
    [imageStatuses]
  );

  const canAddMoreImages = useMemo(() => {
    return !readonly && images.length < maxImages && !uploadState.hasUploadingImages;
  }, [readonly, images.length, maxImages, uploadState.hasUploadingImages]);

  return (
    <View>
      <Text className="mb-2 text-lg text-black">{title}</Text>
      <View className="flex-row flex-wrap items-center gap-3">
        {images.map((uri, idx) => {
          const status = getImageStatus(uri);
          const isUploading = status?.status === 'uploading';
          const isFailed = status?.status === 'failed';

          return (
            <TouchableOpacity
              key={`${uri}-${idx}`}
              onPress={() => removeImage(idx)}
              disabled={readonly || isUploading}
              className="relative h-12 w-12">
              <Image
                source={{ uri }}
                className={`h-12 w-12 rounded-full ${isFailed ? 'opacity-50' : ''}`}
              />
              {isUploading && (
                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/30">
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              {isFailed && (
                <View className="absolute inset-0 items-center justify-center rounded-full bg-red-500/70">
                  <Icon name="close" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        {canAddMoreImages && (
          <TouchableOpacity
            onPress={pickImage}
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Icon name="add" size={24} color="#111" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(ImageUploader);
