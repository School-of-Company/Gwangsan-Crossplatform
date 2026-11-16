// 서버 REST 응답은 오프셋 없는 KST 문자열이라 Date 파싱 결과가 실행 환경 TZ에 따라 달라진다.
// (로컬은 KST, CI 러너는 UTC) 여기서 고정해야 워커가 fork되기 전에 적용된다 —
// 테스트 안에서 process.env.TZ를 바꾸는 것은 이미 초기화된 Date에 반영되지 않는다.
process.env.TZ = 'Asia/Seoul';

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./jest.setup.after-env.js'],
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@sentry/react-native|react-native-toast-message|react-native-keychain|react-native-reanimated|msw|@mswjs|until-async|rettime|@open-draft|is-node-process|outvariant|strict-event-emitter|@bundled-es-modules|statuses|standard-navigation)',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^react-native-keyboard-controller$': '<rootDir>/__mocks__/react-native-keyboard-controller.js',
    '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js',
    // 네이티브 모듈이 없는 Jest에서 import만으로 throw하지 않도록 라이브러리 공식 mock을 쓴다
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
    '^@expo/vector-icons(/.*)?$': '<rootDir>/__mocks__/vector-icons.js',
    '^~/test-utils$': '<rootDir>/src/test-utils/index.ts',
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^axios$': '<rootDir>/node_modules/axios/dist/node/axios.cjs',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e/'],
  // src/app/**는 대부분 Expo Router 라우트 파일(로직 없는 화면 매핑)이라 전부 제외했으나,
  // 실제 로직이 있는 파일은 테스트를 추가하며 하나씩 화이트리스트에 되돌린다.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    'src/app/index.tsx',
    '!src/test-utils/**',
    '!src/mocks/**',
  ],
  coverageReporters: ['json-summary', 'text', 'lcov'],
  // 경로별 기준은 실제 커버리지(2026-11 기준 레이어별 lines 99 / branches 94~95) 바로 아래로 둔다.
  // 경로 기준에 걸린 파일은 global 계산에서 빠지므로, global은 나머지(src/app/index.tsx)만 본다
  coverageThreshold: {
    global: { lines: 95, statements: 95, functions: 85, branches: 65 },
    './src/entity/': { lines: 97, statements: 97, functions: 97, branches: 92 },
    './src/shared/': { lines: 97, statements: 96, functions: 96, branches: 92 },
    './src/widget/': { lines: 97, statements: 96, functions: 94, branches: 91 },
    './src/view/': { lines: 97, statements: 95, functions: 95, branches: 91 },
  },
};
