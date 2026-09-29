import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { getAppVersion, AppVersionResponse } from '../api/getAppVersion';

export const useAppVersion = () =>
  useQuery<AppVersionResponse>({
    queryKey: ['appVersion', Platform.OS],
    queryFn: () => getAppVersion(Platform.OS),
    // 버전 확인 실패는 앱 사용을 막지 않는다 — 조용히 넘어간다.
    retry: false,
  });
