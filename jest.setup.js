/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  // @aws-amplify/react-native does `require(...).default`, which the mock file
  // doesn't provide on its own (it's a plain CJS export, no esModuleInterop shim).
  return { ...mock, default: mock };
});

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

jest.mock('react-native-safe-area-context', () => {
  // The mock file's `export default {...}` compiles to `exports.default = {...}`,
  // so a plain require() here (bypassing Babel's ESM interop) needs unwrapping.
  const mock = require('react-native-safe-area-context/jest/mock');
  return mock.default ?? mock;
});

require('react-native-gesture-handler/jestSetup');
