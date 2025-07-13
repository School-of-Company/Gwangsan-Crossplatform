import { instance } from '../lib/axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ImageType } from '../types/imageType';

export const uploadImage = async (uri: string): Promise<ImageType> => {
  try {
    const filename = uri.split('/').pop() || 'image.jpg';

    let fileType = filename.split('.').pop()?.toLowerCase();
    if (Platform.OS === 'android' && !fileType) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        fileType = uri.match(/\.(jpeg|jpg|png|gif|webp)$/i)?.[1] || 'jpeg';
      }
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
    console.error(error);
    throw error;
  }
};
