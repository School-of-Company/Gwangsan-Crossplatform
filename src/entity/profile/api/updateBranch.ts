import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface UpdateBranchRequest {
  placeId: number;
}

// 지점 변경 전용 엔드포인트 (PATCH /api/member/place, Gwangsan-Server#450)
export const updateBranch = async (data: UpdateBranchRequest): Promise<void> => {
  try {
    await instance.patch('/member/place', data);
  } catch (error) {
    throw toAppError(error);
  }
};
