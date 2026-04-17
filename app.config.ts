import 'dotenv/config';
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        '@sentry/react-native',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          disableAutoUpload: true,
        },
      ],
      './plugins/withNetworkSecurityConfig',
    ],
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL,
      sentryDsn: process.env.SENTRY_DSN,
    },
  };
};
