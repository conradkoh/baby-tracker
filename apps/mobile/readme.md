# Baby Tracker

## Recent Updates

### React Native & Expo SDK Upgrade (October 2025)
The mobile app has been upgraded to the latest canary versions:
- **Expo SDK**: 50 → 55 (canary)
- **React Native**: 0.73.9 → 0.82.0
- **React**: 18.2.0 → 19.1.1

⚠️ **Note**: This uses Expo SDK 55 canary release, which is a pre-release version. Test thoroughly before production deployment.

For detailed information about breaking changes and migration notes, see [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md).

## Development

### Adding a new device for iOS for preview builds

1. Add the device to the Apple Developer account in [devices](https://developer.apple.com/account/resources/devices/list)
2. Run the command `eas device:create`

- There should be a prompt that says that there is a device that has not been registered in the provisioning profile
- There is a QR code, but it is not confirmed if that profile installation is necessary.

3. Rerun the eas build

This should ensure that the build is successful. You will still need to enable developer mode on the iOS device for testing.
