import { useMutation } from '@tanstack/react-query';
import { uploadImage } from '../api/uploadImage';
import { ImageType } from '../types/imageType';
import Toast from 'react-native-toast-message';

export const useUploadImage = () => {
  return useMutation<ImageType, Error, string>({
    mutationFn: (uri: string) => uploadImage(uri),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: '이미지 업로드 성공',
        text2: '이미지가 성공적으로 업로드되었습니다.',
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '이미지 업로드 실패',
        text2: error.message || '이미지 업로드 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });
};
