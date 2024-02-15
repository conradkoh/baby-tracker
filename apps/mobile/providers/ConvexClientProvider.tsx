'use client';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ConvexProvider, ConvexReactClient, useConvex } from 'convex/react';
import { Branch } from '../branch';
import { useBranch } from '../storage/stores/branch';
import { Text, View } from 'react-native';
import { Conditional } from '../components/atoms/Condition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const convexDev = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL_DEV!
);
const convexProd = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL_PROD!
);
enum ConnectionState {
  Ready = 'ready',
  Reconnecting = 'reconnecting',
  Connecting = 'connecting',
}
export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { branch } = useBranch();
  const client = useMemo(() => {
    let client = convexProd;
    if (branch === Branch.Dev) {
      client = convexDev;
    }
    return client;
  }, [branch]);
  return (
    <>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </>
  );
}

export function useConnection() {
  const client = useConvex();
  const [connectionStateHistory, setConnectionStateHistory] = useState([
    ConnectionState.Connecting,
  ]);
  //update connection state
  useEffect(() => {
    const updateIfChanged = (newState: ConnectionState) => {
      const last = connectionStateHistory.at(
        connectionStateHistory?.length - 1
      );
      if (last !== newState) {
        setConnectionStateHistory((prev) => {
          return [...prev.slice(-9), newState]; //keep only last 10 records
        });
      }
    };
    //poll the convex client to check the connection state
    const i = setInterval(() => {
      if (!client.connectionState().isWebSocketConnected) {
        if (connectionStateHistory.length === 1) {
          //this is still the first connection that is pending connection
        } else {
          updateIfChanged(ConnectionState.Reconnecting);
        }
      } else {
        updateIfChanged(ConnectionState.Ready);
      }
    }, 500);
    return () => clearInterval(i);
  }, [client, connectionStateHistory]);
  const connectionState = useMemo(
    () => connectionStateHistory.at(connectionStateHistory.length - 1),
    [connectionStateHistory]
  );
  return useMemo(
    () => ({
      client,
      state: connectionState,
      isConnecting: connectionState === ConnectionState.Connecting,
      isReconnecting: connectionState === ConnectionState.Reconnecting,
      isConnected: connectionState === ConnectionState.Ready,
    }),
    [client, connectionState]
  );
}

export function ConnectionStatus() {
  const conn = useConnection();
  const inset = useSafeAreaInsets();
  return (
    <Conditional render={conn.isReconnecting}>
      <View
        className="bg-orange-100 pb-2 items-center"
        style={{ paddingTop: inset.top }}
      >
        <Text>Reconnecting...</Text>
      </View>
    </Conditional>
  );
}

export function withConvex(Component: React.FC) {
  return function WrappedComponent() {
    return (
      <ConvexClientProvider>
        <Component />
      </ConvexClientProvider>
    );
  };
}
