import { instance } from '~/shared/lib/axios';
import { removeData } from '~/shared/lib/removeData';

export interface SignoutResponse {
  message: string;
}

export const signout = async (): Promise<SignoutResponse> => {
  try {
    const response = await instance.delete<SignoutResponse>('/auth/signout');

    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    return response.data;
  } catch (error) {
    await Promise.all([removeData('accessToken'), removeData('refreshToken')]);

    throw error;
  }
};
