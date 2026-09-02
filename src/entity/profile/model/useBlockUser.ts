import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getErrorMessage } from '~/shared/lib/errorHandler';
import { blockUser, unblockUser } from '../api/blockUser';

export const useBlockUser = (targetMemberId: number | undefined) => {
  const queryClient = useQueryClient();

  const block = useMutation({
    mutationFn: () => {
      if (targetMemberId === undefined) throw new Error('targetMemberId is undefined');
      return blockUser(targetMemberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockList'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      Toast.show({ type: 'success', text1: '차단되었습니다.' });
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: '차단에 실패했습니다.', text2: getErrorMessage(error) });
    },
  });

  const unblock = useMutation({
    mutationFn: () => {
      if (targetMemberId === undefined) throw new Error('targetMemberId is undefined');
      return unblockUser(targetMemberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockList'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      Toast.show({ type: 'success', text1: '차단이 해제되었습니다.' });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: '차단 해제에 실패했습니다.',
        text2: getErrorMessage(error),
      });
    },
  });

  return { block, unblock };
};
