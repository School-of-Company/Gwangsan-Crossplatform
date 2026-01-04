import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    plugins: [
      [
        '@sentry/react-native',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          disableAutoUpload: true,
        },
      ],
    ],
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL,
    },
  };
};
