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

jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock'),
);

// react-native-camera-kit's Camera is a Fabric native component (codegenNativeComponent),
// which the codegen babel plugin can't resolve outside of a real native build. We don't
// exercise real camera behavior in tests, so a no-op component is enough.
jest.mock('react-native-camera-kit', () => {
  const React = require('react');
  return { Camera: React.forwardRef(() => null) };
});

jest.mock('react-native-device-info', () =>
  require('react-native-device-info/jest/react-native-device-info-mock'),
);

// sp-react-native-in-app-updates looks up its native TurboModule on import, which
// doesn't exist outside a real native build. By default there's no update available.
jest.mock('sp-react-native-in-app-updates', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    checkNeedsUpdate: jest.fn().mockResolvedValue({
      shouldUpdate: false,
      other: { updateAvailability: 1 },
    }),
    startUpdate: jest.fn().mockResolvedValue(undefined),
  })),
  IAUAvailabilityStatus: {
    UNKNOWN: 0,
    UNAVAILABLE: 1,
    AVAILABLE: 2,
    DEVELOPER_TRIGGERED: 3,
  },
  IAUUpdateKind: { FLEXIBLE: 0, IMMEDIATE: 1 },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  getMessaging: jest.fn(() => ({})),
  requestPermission: jest.fn().mockResolvedValue(1),
  getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
  onTokenRefresh: jest.fn(() => () => {}),
  onMessage: jest.fn(() => () => {}),
}));
