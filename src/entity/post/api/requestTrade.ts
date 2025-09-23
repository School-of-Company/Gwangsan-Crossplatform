import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';
export interface RequestTradeRequest {
  readonly productId: number;
  readonly otherMemberId: number;
}

export interface RequestTradeResponse {
  readonly success: boolean;
  readonly roomId: number;
}

export const requestTrade = async (data: RequestTradeRequest): Promise<RequestTradeResponse> => {
  try {
    const response = await instance.post<RequestTradeResponse>('/post/trade', data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
