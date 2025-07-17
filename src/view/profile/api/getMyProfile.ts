import { instance } from '~/shared/lib/axios';

export const getMyProfile = async () => {
  try {
    const res = await instance.get('/member');
    return res.data;
  } catch (error) {
    throw error;
  }
};
