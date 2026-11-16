import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestTrade } from '../api/requestTrade';
import { profileQueryKeys } from '~/shared/model/profileQueryKeys';

export const useRequestTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestTrade,
    // 응답만으로는 거래가 완료됐는지 알 수 없다. 완료되면 서버에서 광산이 차감/적립되고 내 프로필은
    // 5분간 캐시되므로, 잔액이 이전 값으로 남지 않게 두 프로필 캐시(프로필 화면·홈 배너)를 함께 갱신한다.
    // Promise를 반환하면 refetch가 끝나야 mutateAsync가 resolve되어 토스트·화면 이동이 늦어진다
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.myProfile() });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.myInformation() });
    },
  });
};
