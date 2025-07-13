import { instance } from '~/shared/lib/axios';

interface CompleteTradeRequest {
  productId: number;
  otherMemberId: number;
}

export const completeTrade = async (data: CompleteTradeRequest) => {
  try {
    await instance.post('/post/trade', data);
    return true;
  } catch (error) {
    throw error;
  }
};
