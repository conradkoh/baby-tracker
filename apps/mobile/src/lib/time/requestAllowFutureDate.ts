import { Alert } from 'react-native';

export async function requestAllowFutureDate(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      'Future Date',
      'Are you sure you want to create a feed in the future?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Yes',
          onPress: () => resolve(true),
        },
      ]
    );
  });
}
