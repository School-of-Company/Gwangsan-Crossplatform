import { instance } from '~/shared/lib/axios';

export interface BlockedMember {
  memberId: number;
  nickname: string;
}

export const getBlockList = async (): Promise<BlockedMember[]> => {
  const res = await instance.get('/block');
  return res.data;
};
