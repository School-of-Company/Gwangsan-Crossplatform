// 서버 REST 응답은 오프셋 없는 KST 문자열이라 Date 파싱 결과가 실행 환경 TZ에 따라 달라진다.
// (로컬은 KST, CI 러너는 UTC) 여기서 고정해야 워커가 fork되기 전에 적용된다 —
// 테스트 안에서 process.env.TZ를 바꾸는 것은 이미 초기화된 Date에 반영되지 않는다.
process.env.TZ = 'Asia/Seoul';

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@sentry/react-native|react-native-toast-message|react-native-keychain|react-native-reanimated|msw|@mswjs|until-async|immer|rettime|@open-draft|is-node-process|outvariant|strict-event-emitter|@bundled-es-modules|statuses)',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^react-native-keyboard-controller$': '<rootDir>/__mocks__/react-native-keyboard-controller.js',
    '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js',
    '^@expo/vector-icons(/.*)?$': '<rootDir>/__mocks__/vector-icons.js',
    '^~/test-utils$': '<rootDir>/src/test-utils/index.ts',
    '^@env$': '<rootDir>/src/mocks/env.ts',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/entity/(.*)$': '<rootDir>/src/entity/$1',
    '^@/view/(.*)$': '<rootDir>/src/view/$1',
    '^@/widget/(.*)$': '<rootDir>/src/widget/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  // src/app/**는 대부분 Expo Router 라우트 파일(로직 없는 화면 매핑)이라 전부 제외했으나,
  // 실제 로직이 있는 파일은 테스트를 추가하며 하나씩 화이트리스트에 되돌린다.
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/app/**', 'src/app/index.tsx'],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  // 실제 커버리지(lines 98.4 / statements 97.5 / functions 96.5 / branches 91.6) 바로 아래로 둬서,
  // 테스트 없는 코드가 크게 늘면 PR이 실패하게 한다. 예전 기준(45/40)은 사실상 아무것도 막지 못했다(#741)
  coverageThreshold: {
    global: {
      lines: 95,
      statements: 95,
      functions: 93,
      branches: 88,
    },
  },
};
