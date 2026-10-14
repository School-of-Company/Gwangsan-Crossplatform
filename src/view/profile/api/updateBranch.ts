import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface UpdateBranchRequest {
  placeId: number;
}

// 지점 변경 전용 엔드포인트(#781). 가입 후 지점을 바꿀 방법이 없어서 추가.
// NOTE: 서버에 이 엔드포인트가 아직 없을 수 있음 — PR 설명 참고.
export const updateBranch = async (data: UpdateBranchRequest): Promise<void> => {
  try {
    await instance.patch('/member/place', data);
  } catch (error) {
    throw toAppError(error);
  }
};
