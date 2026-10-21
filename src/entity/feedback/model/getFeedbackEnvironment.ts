import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import type { FeedbackEnvironment } from '../api/createFeedback';

// 운영자가 문제를 재현할 수 있도록 사용자가 입력하지 않아도 앱/기기 정보를 함께 보낸다.
export const getFeedbackEnvironment = (): FeedbackEnvironment => ({
  appVersion: Application.nativeApplicationVersion,
  osType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  osVersion: Device.osVersion,
  deviceModel: Device.modelName,
});
