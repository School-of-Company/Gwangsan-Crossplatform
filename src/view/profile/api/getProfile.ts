import { instance } from '~/shared/lib/axios';

export const getProfile = async (id: string) => {
  try {
    return (await instance.get('/member/' + id)).data;
  } catch (e) {
    throw e;
  }
};
