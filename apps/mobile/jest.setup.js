// ─── Global mocks for RN + Expo + native modules ─────────────────

// 1. TurboModuleRegistry (required by RN internals)
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const nativeModules = {
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          windowPhysicalPixels: { width: 1170, height: 2532, scale: 3, fontScale: 1 },
          screenPhysicalPixels: { width: 1170, height: 2532, scale: 3, fontScale: 1 },
        },
      }),
    },
    I18nManager: {
      getConstants: () => ({ isRTL: false, doLeftAndRightSwapInRTL: true }),
    },
    PlatformConstants: {
      getConstants: () => ({ forceTouchAvailable: false, interfaceIdiom: 'phone', isTesting: true, osVersion: '17.0', reactNativeVersion: { major: 0, minor: 73, patch: 9 } }),
    },
    StatusBarManager: {
      getConstants: () => ({ HEIGHT: 44, DEFAULT_BACKGROUND_COLOR: 'black' }),
    },
    SoundManager: { getConstants: () => ({}) },
    DevSettings: { getConstants: () => ({}) },
    RedBox: { getConstants: () => ({}) },
    Appearance: { getConstants: () => ({}) },
    LogBox: { getConstants: () => ({}) },
    SourceCode: { getConstants: () => ({ scriptURL: '' }) },
  };
  return {
    getEnforcing: jest.fn((name) => {
      if (nativeModules[name]) return nativeModules[name];
      return { getConstants: () => ({}) };
    }),
    get: jest.fn((name) => {
      if (nativeModules[name]) return nativeModules[name];
      return { getConstants: () => ({}) };
    }),
  };
});

// 2. NativeDeviceInfo — use the built-in RN mock provided by jest-expo
//    (No need to mock manually)

// 3. nativewind (includes NativeWindStyleSheet used by babel plugin)
// The nativewind/babel plugin transforms <View className="..."> into
// <NativeWindStyleSheet.StyledComponent component={View} className="...">
// so we must include StyledComponent in the mock.
jest.mock('nativewind', () => {
  const React = require('react');
  return {
    styled: (component) => component,
    // StyledComponent is what nativewind/babel rewrites className JSX to use
    StyledComponent: ({ component: Component, children, className, tw, ...props }) =>
      React.createElement(Component, props, children),
    useColorScheme: jest.fn(() => ({ colorScheme: 'light' })),
    NativeWindStyleSheet: {
      create: jest.fn(() => ({})),
      get: jest.fn(() => ({})),
    },
  };
});

// 4. AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// 5. FlashList
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    FlashList: ({ renderItem, data }) => {
      return React.createElement(
        View,
        null,
        data?.map((item, index) =>
          renderItem ? React.createElement(View, { key: index }, null) : null
        )
      );
    },
  };
});

// 6. Picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Picker = ({ children }) => React.createElement(View, null, children);
  Picker.Item = () => null;
  return { Picker };
});

// 7. DateTimePicker
jest.mock(
  '@react-native-community/datetimepicker',
  () => 'DateTimePicker'
);

// 8. Vector icons
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons', () => ({ default: () => null }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

// 9. Environment
global.IS_REACT_ACT_ENVIRONMENT = true;

// 10. Suppress noisy console
const originalError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning:') ||
    msg.includes('Not implemented') ||
    msg.includes('ProgressBarAndroid') ||
    msg.includes('has been extracted')
  ) {
    return;
  }
  originalError.call(console, ...args);
};
