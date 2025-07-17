import { instance } from '~/shared/lib/axios';

export interface UpdateProfileRequest {
  nickname: string;
  specialties: string[];
  description: string;
}

export const updateProfile = async (data: UpdateProfileRequest) => {
  try {
    const res = await instance.patch('/member', data);
    return res.data;
  } catch (error) {
    throw error;
  }
};
