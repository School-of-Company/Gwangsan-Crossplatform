import * as Notifications from 'expo-notifications';  
import { getData } from './getData';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type AuthConfig = {
  signInPage: string;
  protectedPages: readonly string[];
  publicPages: readonly string[];
};

export const authConfig: AuthConfig = {
  signInPage: '/signin',
  protectedPages: [],
  publicPages: ['/signin', '/signup', '/onboarding'],
} as const;

export const getAccessToken = async (): Promise<string | null> => {
  return await getData('accessToken');
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await getData('refreshToken');
};
