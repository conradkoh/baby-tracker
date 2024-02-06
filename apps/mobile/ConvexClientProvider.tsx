'use client';
import { ReactNode, useMemo, useState } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Branch } from './branch';

const convexDev = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL_DEV!
);
const convexProd = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL_PROD!
);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  // const [client, setClient] = useState(convexProd);
  const [branch, setBranch] = useState(Branch.Prod);
  const client = useMemo(() => {
    let client = convexProd;
    if (branch === Branch.Dev) {
      client = convexDev;
    }
    return client;
  }, [branch]);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
