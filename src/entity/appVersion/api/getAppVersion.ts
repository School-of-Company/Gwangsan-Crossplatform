import { Platform } from 'react-native';
import { instance } from '~/shared/lib/axios';
import { getErrorMessage } from '~/shared/lib/errorHandler';

export interface AppVersionResponse {
  latestVersion: string;
  // 강제 업데이트(차단)용 필드 — 현재 앱에서는 사용하지 않고 응답 타입에만 남겨둔다.
  minimumVersion: string;
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
    throw new Error(getErrorMessage(error));
  }
};
