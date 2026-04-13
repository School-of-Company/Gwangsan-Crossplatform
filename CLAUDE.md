# CLAUDE.md

시민화폐 광산 (Gwangsan Citizen Currency) — cross-platform React Native (Expo) app for local currency trading in Gwangsan-gu, Gwangju.

## Commands

```bash
npm start / npm run ios / npm run android   # dev
npm run lint / npm run format               # lint
npm test                                    # Jest unit tests
npx jest src/path/to/file.test.ts           # single file
npm run e2e:build:ios && npm run e2e:test:ios   # E2E
```

## Architecture

FSD-inspired layers: `app/` → `view/` → `widget/` → `entity/` → `shared/`

```
shared/
  api/    lib/    store/    ui/    types/    consts/
```

Routing: Expo Router (file-based). Root → `/onboarding`.
State: Zustand (UI) + React Query (server, 5 min cache) + AsyncStorage (tokens).
API: `src/shared/lib/axios.ts` (Bearer token, 401 refresh, 5s timeout, Sentry).
Realtime: `src/shared/lib/socket.ts` (Socket.io singleton).
Styling: NativeWind — `className` prop, never `StyleSheet`.
Alias: `~/` or `@/` → `src/`.

## Environment

```
API_URL=https://api.gwangsan.io.kr/api
EXPO_PUBLIC_SENTRY_DSN / SENTRY_ORG / SENTRY_PROJECT / SENTRY_AUTH_TOKEN
```

## CI/CD

`ci.yml` lint+tsc+test on PR → `main`/`develop`.
`test-ios.yml` / `test-android.yml` — Detox E2E (PR or `/run-e2e` comment).
`ios_cd.yml` / `android_cd.yml` — EAS cloud builds.
