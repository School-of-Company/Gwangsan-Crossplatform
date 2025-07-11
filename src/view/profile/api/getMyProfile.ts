import { instance } from '~/shared/lib/axios';

export const getMyProfile = async () => {
  try {
    return (await instance.get('/member')).data;
  } catch (e) {
    throw e;
  }
};
