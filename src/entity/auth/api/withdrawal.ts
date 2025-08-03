import { instance } from '~/shared/lib/axios';

export interface WithdrawalResponse {
  message: string;
}

export const withdrawal = async (): Promise<WithdrawalResponse> => {
  try {
    const response = await instance.delete<WithdrawalResponse>('/member');

    return response.data;
  } catch (error) {
    throw error;
  }
};
