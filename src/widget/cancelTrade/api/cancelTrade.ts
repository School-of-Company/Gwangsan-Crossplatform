import { instance } from '~/shared/lib/axios';

export const cancelTrade = async (reason: string, imageIds: number[], productId: number) => {
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
