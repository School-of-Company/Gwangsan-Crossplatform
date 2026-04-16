import * as Sentry from '@sentry/react-native';

export const logger = {
  error: (message: string, error?: unknown): void => {
    if (__DEV__) {
      console.error(message, error);
    } else {
      Sentry.captureException(error instanceof Error ? error : new Error(message));
    }
  },
  warn: (message: string, data?: unknown): void => {
    if (__DEV__) {
      console.warn(message, data);
    }
  },
};
