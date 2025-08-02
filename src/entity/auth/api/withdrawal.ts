import { instance } from '~/shared/lib/axios';
import { removeData } from '~/shared/lib/removeData';

export interface WithdrawalResponse {
  message: string;
}

export const withdrawal = async (): Promise<WithdrawalResponse> => {
  try {
    const response = await instance.delete<WithdrawalResponse>('/member');

    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    return response.data;
  } catch (error) {
    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    throw error;
  }
}; 