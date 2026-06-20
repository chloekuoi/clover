module.exports = {
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: [
    '@testing-library/react-native/matchers',
    './jest.setup.js',
  ],
  moduleNameMapper: {
    'react-native-reanimated': require.resolve('react-native-reanimated/mock'),
  },
  // Ignore stale Claude worktree copies so only the real src tree is tested.
  testPathIgnorePatterns: ['/node_modules/', '/\\.claude/'],
  modulePathIgnorePatterns: ['/\\.claude/'],
};
