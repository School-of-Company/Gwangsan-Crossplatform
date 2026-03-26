import { instance } from '~/shared/lib/axios';
import { clearAuthTokens } from '~/shared/lib/auth';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface SignoutResponse {
  message: string;
}

export const signout = async (): Promise<SignoutResponse> => {
  try {
    const response = await instance.delete<SignoutResponse>('/auth/signout');

    await clearAuthTokens();

    return response.data;
  } catch (error) {
    await clearAuthTokens();

    throw new Error(getErrorMessage(error));
  }
};
