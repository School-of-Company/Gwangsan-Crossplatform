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
    // PATCH /member의 409는 별칭 중복뿐이다. 응답 본문이 없어도 원인을 알 수 있게 안내한다
    if (error instanceof AxiosError && error.response?.status === 409) {
      // AxiosError를 그대로 던져야 QueryProvider가 response.status(409)로 재시도 여부를 판단한다
      error.message = DUPLICATE_NICKNAME_MESSAGE;
      throw error;
    }
    // "Request failed with status code 400" 같은 원문 대신 사용자용 메시지로 바꿔 던진다
    throw toAppError(error);
  }
};
