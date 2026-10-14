import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBranch, UpdateBranchRequest } from '../api/updateBranch';
import Toast from 'react-native-toast-message';

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateBranchRequest) => updateBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile', 'current'] });
      // 메인 헤더 등에서 지점명을 보여주는 별도 쿼리(#781)
      queryClient.invalidateQueries({ queryKey: ['myInformation'] });
      Toast.show({
        type: 'success',
        text1: '성공',
        text2: '지점이 변경되었습니다.',
      });
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
