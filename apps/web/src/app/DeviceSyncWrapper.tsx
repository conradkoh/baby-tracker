'use client';

import { useDeviceId } from '@/hooks/useDeviceId';
import { useDeviceSync } from '@/hooks/useDeviceSync';

/**
 * Client wrapper that initializes device ID and syncs with the backend.
 * Place as high in the tree as possible so all children can access device state.
 */
export default function DeviceSyncWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const deviceId = useDeviceId();
  useDeviceSync(deviceId);

  return <>{children}</>;
}
