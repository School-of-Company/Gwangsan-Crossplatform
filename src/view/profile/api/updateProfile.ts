import { AxiosError } from 'axios';
import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

const DUPLICATE_NICKNAME_MESSAGE = '이미 사용 중인 별칭입니다. 다른 별칭을 입력해주세요.';

export interface UpdateProfileRequest {
  nickname: string;
  specialties: string[];
  description: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
  try {
    await instance.patch('/member', data);
  } catch (error) {
    // PATCH /member의 409는 별칭 중복뿐이다. 응답 본문이 없어도 원인을 알 수 있게 안내한다(#780)
    if (error instanceof AxiosError && error.response?.status === 409) {
      throw new Error(DUPLICATE_NICKNAME_MESSAGE);
    }
    // 서버 원문 대신 사용자용 메시지로 바꿔 던진다. 예전에는 "Request failed with status code 400"이
    // 그대로 토스트에 떴다(#739)
    throw toAppError(error);
  }
};
