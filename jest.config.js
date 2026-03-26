module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@sentry/react-native|react-native-toast-message|react-native-keychain|react-native-modal|react-native-reanimated)',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/__mocks__/react-native-reanimated.js',
    '^~/test-utils$': '<rootDir>/src/test-utils/index.ts',
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
};
