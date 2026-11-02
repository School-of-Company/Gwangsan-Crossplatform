import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { getAppVersion, AppVersionResponse } from '../api/getAppVersion';

export const useAppVersion = () =>
  useQuery<AppVersionResponse>({
    queryKey: ['appVersion', Platform.OS],
    queryFn: () => getAppVersion(Platform.OS),
    // 버전 확인 실패는 앱 사용을 막지 않는다 — 조용히 넘어간다. 루트 레이아웃에서 쓰이므로
    // 전역 throwOnError(5xx → ErrorBoundary)를 따르면 앱 전체가 오류 화면이 된다.
    retry: false,
    throwOnError: false,
  });
