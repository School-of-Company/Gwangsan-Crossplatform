import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface WithdrawTradeRequest {
  readonly productId: number;
  readonly otherMemberId: number;
}

export const withdrawTrade = async (data: WithdrawTradeRequest): Promise<void> => {
  try {
    await instance.delete('/post/trade', { data });
  } catch (error) {
    throw toAppError(error);
  }
};
