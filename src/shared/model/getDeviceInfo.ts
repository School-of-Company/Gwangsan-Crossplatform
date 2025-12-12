import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { getData } from '../lib/getData';
import { setData } from '../lib/setData';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('푸시 알림 권한이 거부되었습니다.', finalStatus);
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn(
        'Project ID를 찾을 수 없어 default 설정을 시도합니다. app.json 설정을 확인해 주세요.'
      );
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    return pushToken.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const generateDeviceId = async (): Promise<string> => {
  try {
    const savedDeviceId = await getData('deviceId');
    if (savedDeviceId) {
      return savedDeviceId;
    }

    const deviceType = await Device.getDeviceTypeAsync();
    const brand = Device.brand || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    const osInternalBuildId = Device.osInternalBuildId || 'unknown';
    const modelId = Device.modelId || 'unknown';

    const deviceInfo = `${deviceType}-${brand}-${modelName}-${modelId}-${osVersion}-${osInternalBuildId}`;

    const deviceId =
      deviceInfo.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) ||
      Math.random().toString(36).substring(2, 18);

    await setData('deviceId', deviceId);

    return deviceId;
  } catch (error) {
    console.error(error);
    const randomId = Math.random().toString(36).substring(2, 18);
    await setData('deviceId', randomId);
    return randomId;
  }
};

export const getDeviceInfo = async () => {
  const osType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

  try {
    const deviceToken = await registerForPushNotificationsAsync();
    const deviceId = await generateDeviceId();

    return {
      osType: osType as 'IOS' | 'ANDROID',
      deviceToken: deviceToken || '',
      deviceId: deviceId,
    };
  } catch (error) {
    console.error(error);

    const fallbackDeviceId = await generateDeviceId();
    return {
      osType: osType as 'IOS' | 'ANDROID',
      deviceToken: '',
      deviceId: fallbackDeviceId,
    };
  }
};
