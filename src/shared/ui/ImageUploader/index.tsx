import {
  View,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { memo, useCallback, useMemo } from 'react';
import { ImageType } from '~/shared/types/imageType';
import {
  useImageUploadState,
  type ImageUploadState,
  type SelectedAsset,
} from './useImageUploadState';
import Toast from 'react-native-toast-message';
import { logger } from '~/shared/lib/logger';
import { useThemeColors } from '~/shared/lib/theme';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type { ImageUploadState };

interface Props {
  images?: string[];
  initialImages?: ImageType[];
  onImagesChange?: (images: string[]) => void;
  onImageIdsChange?: (imageIds: number[]) => void;
  onUploadStateChange?: (state: ImageUploadState) => void;
  readonly?: boolean;
  title?: string;
  maxImages?: number;
}

const ImageUploader = ({
  images = [],
  initialImages = [],
  onImagesChange,
  onImageIdsChange,
  onUploadStateChange,
  title = '사진첨부',
  readonly = false,
  maxImages = 5,
}: Props) => {
  const colors = useThemeColors();
  const {
    uploadState,
    getImageStatus,
    removeImageByUri,
    isDuplicateSelection,
    handleImagesSelected,
  } = useImageUploadState({
    images,
    initialImages,
    onImagesChange,
    onImageIdsChange,
    onUploadStateChange,
  });

  const pickFromGallery = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: '권한 필요', text2: '사진 접근 권한이 필요합니다.' });
      return;
    }

    const remainingCount = maxImages - images.length;
    if (remainingCount <= 0) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remainingCount,
        orderedSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const accepted: SelectedAsset[] = [];
      let hasOversized = false;
      let hasDuplicate = false;

      result.assets.forEach((asset) => {
        if (asset.fileSize !== undefined && asset.fileSize > MAX_FILE_SIZE) {
          hasOversized = true;
          return;
        }
        const isDuplicateInBatch = accepted.some((item) =>
          asset.assetId ? item.assetId === asset.assetId : item.uri === asset.uri
        );
        if (isDuplicateInBatch || isDuplicateSelection(asset.uri, asset.assetId)) {
          hasDuplicate = true;
          return;
        }
        accepted.push({ uri: asset.uri, assetId: asset.assetId });
      });

      // 일부 기기의 피커는 selectionLimit을 지키지 않으므로 남은 개수만큼만 첨부한다.
      const exceedsLimit = accepted.length > remainingCount;
      const toAttach = accepted.slice(0, remainingCount);

      if (hasOversized) {
        Toast.show({
          type: 'error',
          text1: '파일 크기 초과',
          text2: '10MB를 넘는 사진은 제외했습니다.',
        });
      } else if (hasDuplicate) {
        Toast.show({
          type: 'error',
          text1: '중복된 사진',
          text2: '이미 추가된 사진은 제외했습니다.',
        });
      } else if (exceedsLimit) {
        Toast.show({
          type: 'error',
          text1: '사진 개수 초과',
          text2: `사진은 최대 ${maxImages}장까지 첨부할 수 있습니다.`,
        });
      }

      await handleImagesSelected(toAttach);
    } catch (error) {
      logger.error('이미지 선택 중 오류', error);
    }
  }, [images.length, maxImages, handleImagesSelected, isDuplicateSelection]);

  const pickFromCamera = useCallback(async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: 'error', text1: '권한 필요', text2: '카메라 접근 권한이 필요합니다.' });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (isDuplicateSelection(asset.uri, asset.assetId)) {
          Toast.show({
            type: 'error',
            text1: '중복된 사진',
            text2: '이미 추가된 사진입니다.',
          });
          return;
        }

        await handleImagesSelected([{ uri: asset.uri, assetId: asset.assetId }]);
      }
    } catch (error) {
      logger.error('카메라 촬영 중 오류', error);
    }
  }, [handleImagesSelected, isDuplicateSelection]);

  const pickImage = useCallback(() => {
    if (readonly || images.length >= maxImages) return;

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
  }, [readonly, images.length, maxImages, pickFromGallery, pickFromCamera]);

  const removeImage = useCallback(
    (index: number) => {
      if (readonly) return;

      const imageUri = images[index];
      if (!imageUri) return;

      removeImageByUri(imageUri);
    },
    [images, readonly, removeImageByUri]
  );

  const canAddMoreImages = useMemo(() => {
    return !readonly && images.length < maxImages && !uploadState.hasUploadingImages;
  }, [readonly, images.length, maxImages, uploadState.hasUploadingImages]);

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg text-foreground">{title}</Text>
        <Text className="text-sm text-gray-500">{`${images.length}/${maxImages}`}</Text>
      </View>
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
              accessibilityRole="button"
              accessibilityLabel={
                isUploading
                  ? `사진 ${idx + 1} 업로드 중`
                  : isFailed
                    ? `사진 ${idx + 1} 업로드 실패, 눌러서 삭제`
                    : `사진 ${idx + 1} 삭제`
              }
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
            accessibilityRole="button"
            accessibilityLabel="사진 추가"
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <Icon name="add" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(ImageUploader);
