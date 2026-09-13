module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@aws-amplify|aws-amplify|uuid|react-native-url-polyfill|react-native-gesture-handler|react-native-reanimated|react-native-drawer-layout|react-native-qrcode-svg|react-native-root-toast|react-native-root-siblings)/)',
  ],
};
