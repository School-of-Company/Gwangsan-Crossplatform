import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface CancelTradeResponse {
  cancelled: boolean;
}

export const cancelTrade = async (
  reason: string,
  imageIds: number[],
  productId: number
): Promise<CancelTradeResponse> => {
  try {
    const { data } = await instance.post<CancelTradeResponse>('/trade/cancel/' + productId, {
      imageIds,
      reason,
    });
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
