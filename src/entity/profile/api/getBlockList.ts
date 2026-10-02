import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface BlockedMember {
  memberId: number;
  nickname: string;
}

export const getBlockList = async (): Promise<BlockedMember[]> => {
  try {
    const { data } = await instance.get<BlockedMember[]>('/block');
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
