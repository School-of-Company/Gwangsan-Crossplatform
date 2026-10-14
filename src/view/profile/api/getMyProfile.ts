import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';
import type { ProfileType } from '~/shared/types/profileType';

export const getMyProfile = async (): Promise<ProfileType> => {
  try {
    const { data } = await instance.get<ProfileType>('/member');
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
