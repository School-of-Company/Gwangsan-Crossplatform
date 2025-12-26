import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    plugins: ['@sentry/react-native'],
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL,
    },
  };
};
