import { useMutation } from '@tanstack/react-query';
import { uploadImage } from '../api/uploadImage';
import { ImageType } from '../types/imageType';
import Toast from 'react-native-toast-message';

interface UseUploadImageOptions {
  // 여러 장을 한 번에 올리는 곳(ImageUploader)은 장마다 토스트를 띄우지 않고 결과를 한 번에 알린다
  showToast?: boolean;
}

export const useUploadImage = ({ showToast = true }: UseUploadImageOptions = {}) => {
  return useMutation<ImageType, Error, string>({
    mutationFn: (uri: string) => uploadImage(uri),
    onSuccess: () => {
      if (!showToast) return;
      Toast.show({
        type: 'success',
        text1: '이미지 업로드 성공',
        text2: '이미지가 성공적으로 업로드되었습니다.',
        visibilityTime: 2000,
      });
    },
    onError: (error) => {
      if (!showToast) return;
      Toast.show({
        type: 'error',
        text1: '이미지 업로드 실패',
        text2: error.message || '이미지 업로드 중 오류가 발생했습니다.',
        visibilityTime: 3000,
      });
    },
  });
};
