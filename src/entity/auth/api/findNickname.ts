import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export const findNickname = async (phoneNumber: string): Promise<string> => {
  try {
    const { data } = await instance.post<{ nickname: string }>('/auth/nickname', { phoneNumber });
    return data.nickname;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
