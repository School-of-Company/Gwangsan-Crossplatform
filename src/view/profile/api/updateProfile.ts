import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface UpdateProfileRequest {
  nickname: string;
  specialties: string[];
  description: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
  try {
    await instance.patch('/member', data);
  } catch (error) {
    // 서버 원문 대신 사용자용 메시지로 바꿔 던진다. 예전에는 "Request failed with status code 400"이
    // 그대로 토스트에 떴다(#739)
    throw toAppError(error);
  }
};
