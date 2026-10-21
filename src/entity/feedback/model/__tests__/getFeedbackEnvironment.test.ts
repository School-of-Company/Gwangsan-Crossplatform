import { Platform } from 'react-native';
import { getFeedbackEnvironment } from '../getFeedbackEnvironment';

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.2.2' }));
jest.mock('expo-device', () => ({ osVersion: '18.0', modelName: 'iPhone 15' }));

describe('getFeedbackEnvironment', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('앱 버전과 기기 정보를 반환한다', () => {
    Platform.OS = 'ios';

    expect(getFeedbackEnvironment()).toEqual({
      appVersion: '1.2.2',
      osType: 'IOS',
      osVersion: '18.0',
      deviceModel: 'iPhone 15',
    });
  });

  it('안드로이드에서는 osType을 ANDROID로 보낸다', () => {
    Platform.OS = 'android';

    expect(getFeedbackEnvironment().osType).toBe('ANDROID');
  });
});
