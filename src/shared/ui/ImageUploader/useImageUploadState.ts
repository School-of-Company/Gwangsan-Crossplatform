import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { useUploadImage } from '@/shared/model/useUploadImage';
import { ImageType } from '@/shared/types/imageType';
import { logger } from '@/shared/lib/logger';

export interface ImageUploadState {
  readonly totalImages: number;
  readonly uploadingCount: number;
  readonly uploadedCount: number;
  readonly hasUploadingImages: boolean;
  readonly hasFailedImages: boolean;
}

// 사진을 여러 장 올려도 결과는 토스트 한 번으로 알린다
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

export interface SelectedAsset {
  uri: string;
  assetId?: string | null;
}

export interface ImageStatus {
  uri: string;
  status: 'uploading' | 'uploaded' | 'failed';
  imageData?: ImageType;
  error?: Error;
}

interface UseImageUploadStateParams {
  readonly images: string[];
  readonly initialImages: ImageType[];
  readonly onImagesChange?: (images: string[]) => void;
  readonly onImageIdsChange?: (imageIds: number[]) => void;
  readonly onUploadStateChange?: (state: ImageUploadState) => void;
}

// 고른 사진의 업로드 진행 상태(업로드 중/완료/실패)와 실패 시 자동 제거, 중복 선택 판별을 맡는다.
// ImageUploader는 사진 고르기와 그리기만 한다
export const useImageUploadState = ({
  images,
  initialImages,
  onImagesChange,
  onImageIdsChange,
  onUploadStateChange,
}: UseImageUploadStateParams) => {
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

  // 실패한 업로드를 1.5초 뒤 자동 제거하는 타이머들. 언마운트 시 정리하지 않으면
  // jest 환경에서 프로세스가 깨끗하게 종료되지 못한다.
  const removalTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const timeouts = removalTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

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
        const timeoutId = setTimeout(() => {
          removalTimeoutsRef.current.delete(timeoutId);
          removeImageByUri(uri);
        }, 1500);
        removalTimeoutsRef.current.add(timeoutId);
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

  const getImageStatus = useCallback(
    (uri: string): ImageStatus | undefined => {
      return imageStatuses.find((status) => status.uri === uri);
    },
    [imageStatuses]
  );

  return {
    uploadState,
    getImageStatus,
    removeImageByUri,
    isDuplicateSelection,
    handleImagesSelected,
  };
};
