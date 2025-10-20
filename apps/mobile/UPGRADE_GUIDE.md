# React Native & Expo SDK Upgrade Guide

## Version Changes

This document outlines the upgrade from Expo SDK 50 to SDK 55 (canary), including React Native and React version updates.

### Major Version Updates

| Package | Previous Version | New Version |
|---------|-----------------|-------------|
| expo | ~50.0.6 | 55.0.0-canary-20251015-a6a1272 |
| react-native | 0.73.9 | 0.82.0 |
| react | 18.2.0 | 19.1.1 |
| react-dom | - | 19.1.1 (new) |

**Note:** This upgrade uses Expo SDK 55 canary release, which is a pre-release version. Canary builds may have stability issues but provide access to the latest React Native 0.82 features.

## Breaking Changes & Migration Steps

### 1. FlashList 2.0 Breaking Changes

**Package:** `@shopify/flash-list` (1.6.3 → 2.0.2)

#### What Changed
FlashList 2.0 no longer requires size estimation for list items. The new architecture dynamically handles item sizing automatically.

#### Migration Required
Remove the `estimatedItemSize` prop from all FlashList components:

```tsx
// Before (SDK 50)
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={200}  // ❌ Remove this
/>

// After (SDK 54)
<FlashList
  data={items}
  renderItem={renderItem}
  // estimatedItemSize no longer needed ✅
/>
```

**Files affected in this project:**
- `src/components/molecules/ActivityList/index.tsx`

### 2. TouchableOpacity TypeScript Changes

**Package:** `react-native` (0.73.9 → 0.81.4)

#### What Changed
The way to reference TouchableOpacity props types has changed in React Native's TypeScript definitions.

#### Migration Required
Use `TouchableOpacityProps` type instead of accessing props from the component:

```tsx
// Before
import { TouchableOpacity } from 'react-native';

type Props = Pick<TouchableOpacity['props'], 'onPress'>;  // ❌ No longer works

// After
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

type Props = Pick<TouchableOpacityProps, 'onPress'>;  // ✅ Correct
```

**Files affected in this project:**
- `src/components/atoms/Button/Icon.tsx`

### 3. New Peer Dependencies

The following packages are now required as peer dependencies:

```json
{
  "@babel/runtime": "^7.20.0",
  "@expo/metro-runtime": "~6.1.2",
  "react-dom": "19.1.0"
}
```

#### Why These Are Required
- **@babel/runtime**: Required by `@shopify/flash-list@2.0.2`
- **@expo/metro-runtime**: Required by `expo-router@6.0.11`
- **react-dom**: Required by various Radix UI components used in expo-router

### 4. React 19 Changes

**Package:** `react` (18.2.0 → 19.1.0)

React 19 brings several improvements and changes. Most existing code continues to work, but be aware of:

- Improved error handling in Server Components
- Enhanced TypeScript support
- Performance improvements
- New hooks and APIs

For detailed React 19 changes, see: https://react.dev/blog/2025/10/15/react-19

## Package Update Summary

### Expo Packages
| Package | Old Version | New Version |
|---------|------------|-------------|
| expo-router | ~3.4.7 | 6.1.0-canary-20251015-a6a1272 |
| expo-constants | ~15.4.5 | 18.0.10-canary-20251015-a6a1272 |
| expo-updates | ~0.24.10 | 29.1.0-canary-20251015-a6a1272 |
| expo-clipboard | ~5.0.1 | 8.0.8-canary-20251015-a6a1272 |
| expo-crypto | ~12.8.1 | 15.0.8-canary-20251015-a6a1272 |
| expo-device | ~5.9.3 | 8.0.10-canary-20251015-a6a1272 |
| expo-linking | ~6.2.2 | 8.0.9-canary-20251015-a6a1272 |
| expo-status-bar | ~1.11.1 | 3.0.9-canary-20251015-a6a1272 |
| @expo/metro-runtime | ~6.1.2 | 6.1.3-canary-20251015-a6a1272 |

### React Native Packages
| Package | Old Version | New Version |
|---------|------------|-------------|
| @react-native-async-storage/async-storage | 1.21.0 | 2.2.0 |
| @react-native-community/datetimepicker | 8.2.0 | 8.4.4 |
| @react-native-picker/picker | 2.6.1 | 2.11.2 |
| react-native-safe-area-context | 4.8.2 | ~5.6.0 |
| react-native-screens | ~3.29.0 | ~4.16.0 |

## New Features Available

### Expo SDK 55 Canary Highlights
- **React Native 0.82 Support**: Latest React Native version with New Architecture improvements
- **React 19.1.1**: Latest React with improved error handling and performance
- **Hermes V1**: Updated JavaScript engine with better performance
- **Faster iOS Builds**: Precompiled React Native for iOS reduces build times
- **Android API Level 36 Support**: Enhanced Android compatibility
- **Reanimated v4**: Better animation performance
- **Improved Edge-to-Edge Layouts**: Better support for modern Android UI patterns

### React Native 0.82 Highlights
- **New Architecture Enhancements**: Improved bridge and performance
- **Hermes V1**: Major update to the JavaScript engine
- **Better TypeScript Support**: Improved type definitions
- **Performance Improvements**: Faster runtime and build times
- **Bug Fixes**: Numerous stability improvements

## Testing Recommendations

After upgrading, thoroughly test the following areas:

1. **List Components**: Verify all FlashList components render correctly
2. **Navigation**: Test all routes and navigation flows with expo-router
3. **Touch Interactions**: Verify all buttons and touchable components work
4. **TypeScript Compilation**: Run `yarn typecheck` to ensure no type errors
5. **Platform-Specific Features**: Test on both iOS and Android if applicable
6. **Third-Party Integrations**: Verify Convex, analytics, and other integrations

## Known Issues

### Canary Release Warning
This upgrade uses Expo SDK 55 canary release (55.0.0-canary-20251015-a6a1272), which is a pre-release version. Canary builds:
- May have stability issues or bugs
- Are not recommended for production use
- Should be tested thoroughly before deployment
- May receive updates that introduce breaking changes

### Workspaces Warning
You may see a warning: "Workspaces can only be enabled in private projects."
- This is expected and can be safely ignored as the project package.json has `"private": true`

### ESLint Version Warning
TypeScript version warnings from ESLint can be ignored. The project uses TypeScript 5.9.3 which is newer than officially supported by the current ESLint plugins, but works correctly.

## Rollback Instructions

If you need to rollback this upgrade:

1. Revert the package.json changes
2. Delete node_modules and yarn.lock
3. Run `yarn install`
4. Restore the code changes to Icon.tsx and ActivityList/index.tsx

## References

- [Expo SDK 55 (Canary)](https://www.npmjs.com/package/expo/v/55.0.0-canary-20251015-a6a1272)
- [React Native 0.82 Release Notes](https://reactnative.dev/blog/2025/10/08/react-native-0.82)
- [Expo SDK Upgrade Guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [React 19 Release Notes](https://react.dev/blog/2025/10/15/react-19)
- [FlashList 2.0 Migration](https://shopify.github.io/flash-list/)

## Support

For issues specific to this upgrade, please:
1. Check the testing recommendations above
2. Review the breaking changes section
3. Consult the official documentation links
4. File an issue in the repository with detailed reproduction steps
