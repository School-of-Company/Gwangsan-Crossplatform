import { useCallback, useEffect, useRef, useState } from 'react';
import * as MediaLibrary from 'expo-media-library/legacy';
import { logger } from '../lib/logger';

export interface LibraryPhoto {
  readonly id: string;
  // 그리드 미리보기용(ph://). 업로드에는 resolvePhotoFileUri로 얻은 파일 경로를 쓴다
  readonly uri: string;
}

const PAGE_SIZE = 60;

export type PhotoLibraryAccess = 'all' | 'limited' | 'none';

// iOS 앱 내 사진 선택 화면에서 쓰는 사진 목록. 최신 사진부터 페이지 단위로 불러온다(#714)
export const usePhotoLibrary = (enabled: boolean) => {
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [access, setAccess] = useState<PhotoLibraryAccess>('none');
  const [isLoading, setIsLoading] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const hasNextPageRef = useRef(true);
  const isFetchingRef = useRef(false);

  const loadPage = useCallback(async (reset: boolean) => {
    if (isFetchingRef.current) return;
    if (!reset && !hasNextPageRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const page = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: reset ? undefined : cursorRef.current,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      cursorRef.current = page.endCursor;
      hasNextPageRef.current = page.hasNextPage;
      const nextPhotos = page.assets.map(({ id, uri }) => ({ id, uri }));
      setPhotos((prev) => (reset ? nextPhotos : [...prev, ...nextPhotos]));
    } catch (error) {
      logger.error('Failed to load photo library', error);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    MediaLibrary.getPermissionsAsync(false)
      .then((permission) => {
        if (!isMounted) return;
        setAccess(permission.granted ? (permission.accessPrivileges ?? 'all') : 'none');
      })
      .catch(() => {});
    loadPage(true);

    // "선택한 사진만 허용"에서 사진을 더 고르거나 앨범이 바뀌면 목록을 새로 불러온다
    const subscription = MediaLibrary.addListener(() => {
      loadPage(true);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [enabled, loadPage]);

  const loadMore = useCallback(() => loadPage(false), [loadPage]);

  const selectMorePhotos = useCallback(async () => {
    try {
      await MediaLibrary.presentPermissionsPickerAsync(['photo']);
    } catch (error) {
      logger.warn('Failed to present limited photos picker', error);
    }
  }, []);

  return { photos, access, isLoading, loadMore, selectMorePhotos };
};

// iOS 사진 권한 요청. "선택한 사진만 허용"(limited)도 앱 내 선택 화면을 쓸 수 있다
export const requestPhotoLibraryAccess = async (): Promise<boolean> => {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(false);
    return permission.granted;
  } catch (error) {
    logger.warn('Failed to request photo library permission', error);
    return false;
  }
};

// 그리드의 ph:// 주소는 업로드할 수 없으므로, 업로드 직전에 로컬 파일 경로로 바꾼다
export const resolvePhotoFileUri = async (photoId: string): Promise<string | null> => {
  const info = await MediaLibrary.getAssetInfoAsync(photoId);
  return info.localUri ?? null;
};
