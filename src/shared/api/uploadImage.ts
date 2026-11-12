import { instance } from '~/shared/lib/axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ImageType } from '~/shared/types/imageType';
import { logger } from '~/shared/lib/logger';
import { toAppError } from '~/shared/lib/errorHandler';
import { prepareImageForUpload } from '~/shared/lib/prepareImageForUpload';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 전역 타임아웃(5초)은 최대 10MB 업로드에는 짧아 셀룰러 환경에서 실패하므로 따로 길게 잡는다
export const UPLOAD_TIMEOUT_MS = 60_000;

export const uploadImage = async (originalUri: string): Promise<ImageType> => {
  try {
    const uri = await prepareImageForUpload(originalUri);
    const file = new FileSystem.File(uri);
    if (file.exists && file.size > MAX_FILE_SIZE) {
      throw new Error('파일 크기가 10MB를 초과합니다');
    }

    const filename = uri.split('/').pop() || 'image.jpg';

    let fileType = filename.split('.').pop()?.toLowerCase();
    if (Platform.OS === 'android' && !fileType) {
      fileType = uri.match(/\.(jpeg|jpg|png|gif|webp)$/i)?.[1] || 'jpeg';
    }

    // 리사이즈 결과는 .jpg로 나오는데 정식 MIME은 image/jpeg다
    const type = `image/${!fileType || fileType === 'jpg' ? 'jpeg' : fileType}`;

    const formData = new FormData();
    // RN의 FormData는 Blob 대신 { uri, name, type } 파일 객체를 받는다
    formData.append('file', { uri, name: filename, type } as unknown as Blob);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: UPLOAD_TIMEOUT_MS,
    };

    const response = await instance.post<ImageType>('/image', formData, config);

    return response.data;
  } catch (error) {
    logger.error('uploadImage failed', error);
    throw toAppError(error);
  }
};
