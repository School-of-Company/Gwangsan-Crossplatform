import { instance } from '~/shared/lib/axios';

export const cancelTrade = async (productId: string, imageIds: number[], reason: string) => {
  try {
    const res = await instance.post('/trade/cancel/' + productId, {
      imageIds,
      reason,
    });
    return res;
  } catch (error) {
    throw error;
  }
};
