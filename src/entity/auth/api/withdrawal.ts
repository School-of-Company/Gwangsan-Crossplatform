import { instance } from '~/shared/lib/axios';
import { removeData } from '~/shared/lib/removeData';
import { getData } from '~/shared/lib/getData';

export interface WithdrawalResponse {
  message: string;
}

export const withdrawal = async (): Promise<WithdrawalResponse> => {
  try {
    const accessToken = await getData('accessToken');

    const response = await instance.delete<WithdrawalResponse>('/member', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    return response.data;
  } catch (error) {
    throw error;
  }
};
