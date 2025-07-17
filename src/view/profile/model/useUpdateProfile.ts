import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, UpdateProfileRequest } from '../api/updateProfile';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Toast.show({
        type: 'success',
        text1: '성공',
        text2: '프로필이 수정되었습니다.',
      });
      router.back();
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '오류',
        text2: error.message,
      });
    },
  });
}; 