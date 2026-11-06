import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { useAppVersion } from '~/entity/appVersion';
import { isValidVersion, isVersionLower } from '~/shared/lib/versionCompare';
import { AlertModal } from '~/shared/ui/AlertModal';

const DISMISS_STORAGE_KEY = 'appVersionUpdateDismissed';
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const IOS_STORE_URL = 'itms-apps://apps.apple.com/app/id6758655368';
const ANDROID_STORE_URL = 'market://details?id=gwangsan.io.kr';
const ANDROID_STORE_WEB_URL = 'https://play.google.com/store/apps/details?id=gwangsan.io.kr';

interface DismissRecord {
  dismissedAt: string;
  dismissedVersion: string;
}

// "나중에"를 누른 뒤 7일간은 다시 띄우지 않는다. 단, 그 사이 서버 최신 버전이
// 더 올라갔다면 미룬 버전보다 새로운 것이므로 기간과 무관하게 즉시 다시 띄운다.
const isDismissed = async (latestVersion: string): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;

    const { dismissedAt, dismissedVersion } = JSON.parse(raw) as DismissRecord;
    if (!dismissedVersion || isVersionLower(dismissedVersion, latestVersion)) return false;

    const elapsed = Date.now() - new Date(dismissedAt).getTime();
    return Number.isFinite(elapsed) && elapsed < DISMISS_WINDOW_MS;
  } catch {
    // 저장값이 깨졌거나 읽기에 실패하면 안내를 막지 않는다.
    return false;
  }
};

// minimumVersion이 없거나 형식이 깨졌으면 강제하지 않는다 — 잘못된 설정으로 앱을 막지 않기 위해
const isForceUpdateRequired = (
  currentVersion: string | null,
  minimumVersion: string | null | undefined
): boolean =>
  !!currentVersion &&
  isValidVersion(minimumVersion) &&
  isVersionLower(currentVersion, minimumVersion.trim());

export function VersionUpdateModal() {
  const { data } = useAppVersion();
  const [isVisible, setIsVisible] = useState(false);
  const latestVersion = data?.latestVersion;
  const currentVersion = Application.nativeApplicationVersion;
  const isForced = isForceUpdateRequired(currentVersion, data?.minimumVersion);

  useEffect(() => {
    if (isForced || !latestVersion || !currentVersion) return;
    if (!isVersionLower(currentVersion, latestVersion)) return;

    let isMounted = true;
    isDismissed(latestVersion).then((dismissed) => {
      if (isMounted && !dismissed) setIsVisible(true);
    });

    return () => {
      isMounted = false;
    };
  }, [isForced, latestVersion, currentVersion]);

  const handleLater = useCallback(() => {
    setIsVisible(false);
    if (!latestVersion) return;
    const record: DismissRecord = {
      dismissedAt: new Date().toISOString(),
      dismissedVersion: latestVersion,
    };
    AsyncStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(record)).catch(() => {});
  }, [latestVersion]);

  const handleUpdate = useCallback(() => {
    // 강제 업데이트는 스토어에서 업데이트하지 않고 돌아와도 계속 막아야 하므로 닫지 않는다
    if (!isForced) setIsVisible(false);
    if (Platform.OS === 'ios') {
      Linking.openURL(IOS_STORE_URL).catch(() => {});
      return;
    }
    // 플레이스토어 앱이 없는 기기(market:// 스킴 미지원)에서는 웹 스토어로 보낸다.
    Linking.openURL(ANDROID_STORE_URL).catch(() => {
      Linking.openURL(ANDROID_STORE_WEB_URL).catch(() => {});
    });
  }, [isForced]);

  if (isForced) {
    return (
      <AlertModal
        isVisible
        message="업데이트 후 이용할 수 있습니다"
        confirmText="업데이트"
        onConfirm={handleUpdate}
        dismissible={false}
      />
    );
  }

  return (
    <AlertModal
      isVisible={isVisible}
      message="새로운 버전이 출시되었습니다"
      cancelText="나중에"
      confirmText="업데이트"
      onCancel={handleLater}
      onConfirm={handleUpdate}
    />
  );
}
