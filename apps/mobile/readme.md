# Baby Tracker

## Recent Updates

### React Native & Expo SDK Upgrade (October 2025)
The mobile app has been upgraded to the latest versions:
- **Expo SDK**: 50 → 54
- **React Native**: 0.73.9 → 0.81.4
- **React**: 18.2.0 → 19.1.0

For detailed information about breaking changes and migration notes, see [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md).

## Development

### Adding a new device for iOS for preview builds

1. Add the device to the Apple Developer account in [devices](https://developer.apple.com/account/resources/devices/list)
2. Run the command `eas device:create`

- There should be a prompt that says that there is a device that has not been registered in the provisioning profile
- There is a QR code, but it is not confirmed if that profile installation is necessary.

3. Rerun the eas build

This should ensure that the build is successful. You will still need to enable developer mode on the iOS device for testing.
