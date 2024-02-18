'use client';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ConvexProvider, ConvexReactClient, useConvex } from 'convex/react';
import { Branch } from '../branch';
import { useBranch } from '../storage/stores/branch';
import { Text, View } from 'react-native';
import { Conditional } from '../components/atoms/Condition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const convexDev = () =>
  new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL_DEV!);
const convexProd = () =>
  new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL_PROD!);
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
  const [client, setClient] = useState<ConvexReactClient | null>(null);
  useEffect(() => {
    let client: ConvexReactClient | null = null;
    if (branch == Branch.Prod) {
      client = convexProd();
    } else if (branch == Branch.Dev) {
      client = convexDev();
    }

    setClient(client);
    return () => {
      client?.close();
    };
  }, [branch]);
  if (!client) {
    return <></>;
  }

  return (
    <>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </>
  );
}

export function useConnection() {
  const client = useConvex();
  const [connectionStateHistory, setConnectionStateHistory] = useState([
    client.connectionState().isWebSocketConnected
      ? ConnectionState.Ready
      : ConnectionState.Connecting,
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
        className="bg-orange-200 pb-2 items-center"
        style={{ height: inset.top }}
      ></View>
    </Conditional>
  );
}

/**
 * This wrapper component ensures that the wrapped component reloads when convex reconnects
 * @param Component
 * @returns
 */
export function withReloadOnReconnect(Component: React.FC) {
  return function ReloadOnReconnectWrapper() {
    const conn = useConnection();
    const [isConnected, setConnected] = useState(conn.isConnected);
    const [render, setRender] = useState(true);
    useEffect(() => {
      if (!isConnected && conn.isConnected) {
        console.log('reconnected - reloading components');
        setConnected(true); //update the connection state
        setRender(false);
        setTimeout(() => setRender(true), 100);
      }
    }, [conn.isConnected, isConnected]);
    return (
      <Conditional render={render}>
        <Component />
      </Conditional>
    );
  };
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
