import { useState, useCallback } from 'react';

export interface ImageLoadingState {
  isLoading: boolean;
  hasError: boolean;
}

export interface UseImageLoaderReturn {
  imageStates: Record<number, ImageLoadingState>;
  handleImageLoadStart: (imageId: number) => void;
  handleImageLoadEnd: (imageId: number) => void;
  handleImageError: (imageId: number) => void;
  isImageLoading: (imageId: number) => boolean;
  hasImageError: (imageId: number) => boolean;
}

export const useImageLoader = (): UseImageLoaderReturn => {
  const [imageStates, setImageStates] = useState<Record<number, ImageLoadingState>>({});

  const handleImageLoadStart = useCallback((imageId: number) => {
    setImageStates((prev) => ({
      ...prev,
      [imageId]: { isLoading: true, hasError: false },
    }));
  }, []);

  const handleImageLoadEnd = useCallback((imageId: number) => {
    setImageStates((prev) => ({
      ...prev,
      [imageId]: { isLoading: false, hasError: false },
    }));
  }, []);

  const handleImageError = useCallback((imageId: number) => {
    setImageStates((prev) => ({
      ...prev,
      [imageId]: { isLoading: false, hasError: true },
    }));
  }, []);

  const isImageLoading = useCallback(
    (imageId: number) => {
      return imageStates[imageId]?.isLoading ?? false;
    },
    [imageStates]
  );

  const hasImageError = useCallback(
    (imageId: number) => {
      return imageStates[imageId]?.hasError ?? false;
    },
    [imageStates]
  );

  return {
    imageStates,
    handleImageLoadStart,
    handleImageLoadEnd,
    handleImageError,
    isImageLoading,
    hasImageError,
  };
};
