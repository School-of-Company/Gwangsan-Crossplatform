import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface WithdrawalResponse {
  message: string;
}

export const withdrawal = async (): Promise<WithdrawalResponse> => {
  try {
    const response = await instance.delete<WithdrawalResponse>('/member');

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
