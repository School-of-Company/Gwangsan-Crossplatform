import { useMutation } from '@tanstack/react-query';
import { withdrawTrade } from '../api/withdrawTrade';

export const useWithdrawTrade = () => useMutation({ mutationFn: withdrawTrade });
