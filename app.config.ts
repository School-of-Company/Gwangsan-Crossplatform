import 'dotenv/config';
import { existsSync } from 'fs';
import { ExpoConfig } from '@expo/config';

export default ({ config }: { config: ExpoConfig }) => {
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
  const hasGoogleServices = existsSync(googleServicesFile);

  // app.json declares `googleServicesFile`; drop it when the file is absent so
  // config parsing doesn't fail on local machines without the Firebase secret.
  const { googleServicesFile: _drop, ...androidConfig } = config.android ?? {};

  return {
    ...config,
    android: {
      ...androidConfig,
      ...(hasGoogleServices ? { googleServicesFile } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      './plugins/withNetworkSecurityConfig',
      // Android E2E(Detox) 빌드에서만 켠다. 스토어 빌드에는 테스트 의존성·localhost cleartext가 들어가지 않는다
      ...(process.env.DETOX_ANDROID_E2E === 'true' ? ['./plugins/withDetoxAndroid'] : []),
    ],
    extra: {
      ...config.extra,
      // env 미주입 시 app.json의 extra.apiUrl을 undefined로 덮어쓰지 않는다.
      apiUrl: process.env.API_URL ?? config.extra?.apiUrl,
      sentryDsn: process.env.SENTRY_DSN,
    },
  };
};
