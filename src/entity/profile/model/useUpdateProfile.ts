import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, UpdateProfileRequest } from '../api/updateProfile';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ProfileType } from '~/shared/types/profileType';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (_, variables) => {
      // 서버가 수정된 값을 돌려주지 않으므로 보낸 값으로 캐시를 바로 고친다. invalidate만 하면
      // refetch가 끝나기 전까지 프로필 화면에 이전 별칭이 남는다
      const applyUpdate = (prev: ProfileType | undefined) =>
        prev ? { ...prev, ...variables } : prev;
      const myProfile = queryClient.setQueryData<ProfileType>(
        profileQueryKeys.myProfile(),
        applyUpdate
      );
      if (myProfile) {
        queryClient.setQueryData<ProfileType>(
          profileQueryKeys.profile(String(myProfile.memberId)),
          applyUpdate
        );
      }

      queryClient.invalidateQueries({ queryKey: profileQueryKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.profileAll });
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
