import { instance } from '~/shared/lib/axios';

export const blockUser = async (targetMemberId: number) => {
  const res = await instance.post(`/block/${targetMemberId}`);
  return res.data;
};

export const unblockUser = async (targetMemberId: number) => {
  const res = await instance.delete(`/block/${targetMemberId}`);
  return res.data;
};
