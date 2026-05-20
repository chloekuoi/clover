module.exports = {
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: [
    '@testing-library/react-native/matchers',
    './jest.setup.js',
  ],
  moduleNameMapper: {
    'react-native-reanimated': require.resolve('react-native-reanimated/mock'),
  },
};
