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
import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useUploadImage } from '@/shared/model/useUploadImage';
import { ImageType } from '@/shared/types/imageType';
import Toast from 'react-native-toast-message';
import { logger } from '@/shared/lib/logger';
import { useThemeColors } from '@/shared/lib/theme';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface ImageUploadState {
  readonly totalImages: number;
  readonly uploadingCount: number;
  readonly uploadedCount: number;
  readonly hasUploadingImages: boolean;
  readonly hasFailedImages: boolean;
}

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

// 사진을 여러 장 올려도 결과는 토스트 한 번으로 알린다. 예전에는 장마다 성공 토스트가 떠
// 5장을 올리면 토스트가 5개 겹쳐 떴다
const showUploadResultToast = (successCount: number, totalCount: number) => {
  if (totalCount === 0) return;

  if (successCount === totalCount) {
    Toast.show({
      type: 'success',
      text1: '이미지 업로드 성공',
      text2:
        totalCount === 1
          ? '이미지가 성공적으로 업로드되었습니다.'
          : `이미지 ${totalCount}장이 업로드되었습니다.`,
      visibilityTime: 2000,
    });
    return;
  }

  const failedCount = totalCount - successCount;
  Toast.show({
    type: 'error',
    text1: '이미지 업로드 실패',
    text2:
      totalCount === 1
        ? '이미지 업로드 중 오류가 발생했습니다.'
        : `${totalCount}장 중 ${failedCount}장을 업로드하지 못했습니다.`,
    visibilityTime: 3000,
  });
};

interface SelectedAsset {
  uri: string;
  assetId?: string | null;
}

interface ImageStatus {
  uri: string;
  status: 'uploading' | 'uploaded' | 'failed';
  imageData?: ImageType;
  error?: Error;
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
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>(() =>
    initialImages.map((img) => ({
      uri: img.imageUrl,
      status: 'uploaded' as const,
      imageData: img,
    }))
  );
  const isInitialized = useRef(false);

  useEffect(() => {
    if (initialImages.length > 0 && !isInitialized.current && imageStatuses.length === 0) {
      setImageStatuses(
        initialImages.map((img) => ({
          uri: img.imageUrl,
          status: 'uploaded' as const,
          imageData: img,
        }))
      );
      isInitialized.current = true;
    }
  }, [initialImages, imageStatuses.length]);

  const uploadImageMutation = useUploadImage({ showToast: false });
  const colors = useThemeColors();

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

  useEffect(() => {
    const uploadedIds = imageStatuses
      .filter((s) => s.status === 'uploaded' && s.imageData)
      .map((s) => s.imageData!.imageId);
    onImageIdsChange?.(uploadedIds);
  }, [imageStatuses, onImageIdsChange]);

  const updateImageStatus = useCallback((uri: string, status: Partial<ImageStatus>) => {
    setImageStatuses((prev) =>
      prev.map((item) => (item.uri === uri ? { ...item, ...status } : item))
    );
  }, []);

  // uploadImage가 실패 후 1.5초 뒤 예약하는 자동 제거 호출은 uri가 images에
  // 추가되기 "전" 시점의 클로저를 캡처하기 때문에, images를 직접 의존성으로 참조하면
  // 항상 images.indexOf(uri) === -1이 되어 제거가 조용히 무시된다. ref로 최신 images를
  // 읽어 이 문제를 피한다.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // 갤러리에서 같은 사진을 다시 선택하면 매번 새 임시 uri가 발급되므로 uri만으로는
  // 중복을 판별할 수 없다. 라이브러리 원본 자산을 가리키는 assetId를 uri별로 기억해두고
  // 우선적으로 비교한다.
  const assetIdsByUriRef = useRef<Map<string, string>>(new Map());

  const removeImageByUri = useCallback(
    (uri: string) => {
      const currentImages = imagesRef.current;
      const imageIndex = currentImages.indexOf(uri);
      if (imageIndex === -1) return;

      const newImages = currentImages.filter((img) => img !== uri);
      onImagesChange?.(newImages);

      assetIdsByUriRef.current.delete(uri);
      setImageStatuses((prev) => prev.filter((item) => item.uri !== uri));
    },
    [onImagesChange]
  );

  const isDuplicateSelection = useCallback(
    (uri: string, assetId?: string | null) => {
      if (assetId) {
        return Array.from(assetIdsByUriRef.current.values()).includes(assetId);
      }
      return images.includes(uri);
    },
    [images]
  );

  // 업로드 성공 여부를 돌려줘, 한 번에 고른 사진들의 결과를 모아 토스트를 한 번만 띄운다
  const uploadImage = useCallback(
    async (uri: string): Promise<boolean> => {
      try {
        const uploadedImage = await uploadImageMutation.mutateAsync(uri);
        updateImageStatus(uri, { status: 'uploaded', imageData: uploadedImage });
        return true;
      } catch (error) {
        logger.error('Image upload failed', error);
        updateImageStatus(uri, {
          status: 'failed',
          error: error instanceof Error ? error : new Error('업로드 실패'),
        });
        setTimeout(() => removeImageByUri(uri), 1500);
        return false;
      }
    },
    [uploadImageMutation, updateImageStatus, removeImageByUri]
  );

  // 여러 장을 한 장씩 onImagesChange([...images, uri])로 반영하면 모두 같은 클로저의
  // images를 기준으로 계산되어 앞서 추가한 사진이 덮어써진다. 고른 사진 전체를 한 번에
  // 반영한 뒤 업로드는 병렬로 진행한다.
  const handleImagesSelected = useCallback(
    async (assets: SelectedAsset[]) => {
      if (assets.length === 0) return;

      assets.forEach(({ uri, assetId }) => {
        if (assetId) {
          assetIdsByUriRef.current.set(uri, assetId);
        }
      });

      onImagesChange?.([...images, ...assets.map(({ uri }) => uri)]);
      setImageStatuses((prev) => [
        ...prev,
        ...assets.map(({ uri }): ImageStatus => ({ uri, status: 'uploading' })),
      ]);

      const results = await Promise.all(assets.map(({ uri }) => uploadImage(uri)));
      showUploadResultToast(results.filter(Boolean).length, results.length);
    },
    [images, onImagesChange, uploadImage]
  );

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
            <Icon name="add" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default memo(ImageUploader);
