import { instance } from '../lib/axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ImageType } from '../types/imageType';
import { logger } from '../lib/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const uploadImage = async (uri: string): Promise<ImageType> => {
  try {
    const file = new FileSystem.File(uri);
    if (file.exists && file.size > MAX_FILE_SIZE) {
      throw new Error('파일 크기가 10MB를 초과합니다');
    }

    const filename = uri.split('/').pop() || 'image.jpg';

    let fileType = filename.split('.').pop()?.toLowerCase();
    if (Platform.OS === 'android' && !fileType) {
      fileType = uri.match(/\.(jpeg|jpg|png|gif|webp)$/i)?.[1] || 'jpeg';
    }

    const type = `image/${fileType || 'jpeg'}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await instance.post<ImageType>('/image', formData, config);

    return response.data;
  } catch (error) {
    logger.error('uploadImage failed', error);
    throw error;
  }
};
