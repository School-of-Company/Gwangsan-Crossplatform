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
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@sentry/react-native|react-native-toast-message|react-native-keychain|react-native-modal|react-native-reanimated|msw|@mswjs|until-async|immer|rettime|@open-draft|is-node-process|outvariant|strict-event-emitter|@bundled-es-modules|statuses)',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^react-native-keyboard-controller$': '<rootDir>/__mocks__/react-native-keyboard-controller.js',
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
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/app/**'],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      lines: 45,
      statements: 45,
      functions: 45,
      branches: 40,
    },
  },
};
