# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

시민화폐 광산 (Gwangsan Citizen Currency) — a cross-platform React Native (Expo) app for local currency trading in Gwangsan-gu, Gwangju. Users post trades for goods/services using virtual currency "광산", chat in real-time, and manage profiles/reviews.

## Commands

```bash
# Development
npm start             # Start Expo dev server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator

# Linting & Formatting
npm run lint          # ESLint + Prettier check
npm run format        # Auto-fix lint and formatting

# Unit Tests (Jest)
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# E2E Tests (Detox)
npm run e2e:build:ios          # Build iOS app for E2E
npm run e2e:test:ios           # Run iOS E2E tests
npm run e2e:build:android      # Build Android app for E2E
npm run e2e:test:android       # Run Android E2E tests
```

To run a single Jest test file:
```bash
npx jest src/path/to/file.test.ts
```

## Architecture

The project follows a layered Feature-Sliced Design (FSD)-inspired architecture:

```
src/
├── app/        # Expo Router file-based pages (routes)
├── view/       # Page-level components (model/ + ui/ per feature)
├── widget/     # Reusable feature components (model/ + ui/ per feature)
├── entity/     # Domain models and business logic
└── shared/     # Cross-cutting concerns
    ├── api/    # API call functions
    ├── lib/    # Axios instance, socket.io, Sentry, auth utilities
    ├── store/  # Zustand stores (UI state)
    ├── ui/     # Primitive UI components (Button, Card, Input, Modal, etc.)
    ├── types/  # Shared TypeScript types
    └── consts/ # App-wide constants
```

### Routing

File-based routing via Expo Router. Root redirects to `/onboarding`. Main routes: `/signin`, `/signup`, `/main`, `/post/[id]`, `/chatting/[id]`, `/profile/[id]`, `/notification`, `/reviews`.

### State Management

- **Zustand** — UI/form state (signin, signup, chat queue, reset password)
- **React Query (TanStack)** — server state with 5-minute cache
- **AsyncStorage** — persisted auth tokens

### API & Networking

- Axios instance at `src/shared/lib/axios.ts` with interceptors:
  - Auto-attaches Bearer token from AsyncStorage
  - Handles 401 with automatic token refresh
  - 5000ms timeout
  - Sentry breadcrumb integration
- Base URL from env: `API_URL=https://api.gwangsan.io.kr/api`
- Socket.io client at `src/shared/lib/socket.ts` for real-time chat

### Testing

- **MSW** mocks in `src/mocks/` for API mocking in unit tests
- Test helpers in `src/test-utils/`
- **Detox** E2E tests in `e2e/` targeting iOS and Android simulators

### Styling

NativeWind (Tailwind CSS for React Native). Custom colors defined in `tailwind.config.js`.

### Path Aliases

TypeScript and Metro are configured with path aliases — use `@/` to import from `src/` (e.g., `import { Button } from '@/shared/ui/Button'`).

## Environment Variables

Required in `.env`:
```
API_URL=https://api.gwangsan.io.kr/api
EXPO_PUBLIC_SENTRY_DSN=...
SENTRY_ORG=schoolcompany
SENTRY_PROJECT=react-native
SENTRY_AUTH_TOKEN=...
```

## CI/CD

GitHub Actions workflows:
- **ci.yml** — lint, type-check, unit tests on push/PR to `main`/`develop`
- **test-ios.yml** / **test-android.yml** — E2E tests (triggered by PR, manual dispatch, or `/run-e2e` comment)
- **ios_cd.yml** / **android_cd.yml** — EAS cloud builds for deployment
