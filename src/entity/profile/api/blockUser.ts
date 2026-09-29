import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export const blockUser = async (targetMemberId: number): Promise<void> => {
  try {
    await instance.post(`/block/${targetMemberId}`);
  } catch (error) {
    throw toAppError(error);
  }
};

export const unblockUser = async (targetMemberId: number): Promise<void> => {
  try {
    await instance.delete(`/block/${targetMemberId}`);
  } catch (error) {
    throw toAppError(error);
  }
};
