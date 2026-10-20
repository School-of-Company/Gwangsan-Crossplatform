import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface UpdateBranchRequest {
  placeId: number;
}

// 지점 변경 전용 엔드포인트(#781). 가입 후 지점을 바꿀 방법이 없어서 추가.
// NOTE: 서버 엔드포인트는 Gwangsan-Server#448에서 추가 예정. 배포 전까지는 호출이 실패한다.
export const updateBranch = async (data: UpdateBranchRequest): Promise<void> => {
  try {
    await instance.patch('/member/place', data);
  } catch (error) {
    throw toAppError(error);
  }
};
