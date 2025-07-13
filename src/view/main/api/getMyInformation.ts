import { instance } from '~/shared/lib/axios';

export const getMyInformation = async () => {
  try {
    return (await instance.get('/member')).data;
  } catch (error) {
    throw error;
  }
};
