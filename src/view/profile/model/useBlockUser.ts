import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { blockUser, unblockUser } from '../api/blockUser';

export const useBlockUser = (targetMemberId: number) => {
  const block = useMutation({
    mutationFn: () => blockUser(targetMemberId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: '차단되었습니다.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: '차단에 실패했습니다.' });
    },
  });

  const unblock = useMutation({
    mutationFn: () => unblockUser(targetMemberId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: '차단이 해제되었습니다.' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: '차단 해제에 실패했습니다.' });
    },
  });

  return { block, unblock };
};
