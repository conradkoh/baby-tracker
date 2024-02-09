import { Text, View } from 'react-native';

export const Loader = (props: {
  loading: boolean;
  children?: React.ReactNode;
}) => {
  if (props.loading) {
    return (
      <>
        <View className="p-4 flex-row align-middle justify-center">
          <Text>⏳</Text>
        </View>
      </>
    );
  }
  return <>{props.children}</>;
};
