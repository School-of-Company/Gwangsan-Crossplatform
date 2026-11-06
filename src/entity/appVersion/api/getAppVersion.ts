import { Platform } from 'react-native';
import { instance } from '~/shared/lib/axios';
import { toAppError } from '~/shared/lib/errorHandler';

export interface AppVersionResponse {
  latestVersion: string;
  // 이보다 낮은 버전은 강제 업데이트 대상. 서버는 x.y.z를 보장하지만(AppVersion 도메인 검증),
  // 값이 없거나 깨져도 앱을 막지 않도록 optional로 두고 쓰는 쪽에서 검증한다.
  minimumVersion?: string | null;
}

export const getAppVersion = async (
  platform: string = Platform.OS
): Promise<AppVersionResponse> => {
  try {
    const { data } = await instance.get<AppVersionResponse>('/app/version', {
      params: { platform },
    });
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};
