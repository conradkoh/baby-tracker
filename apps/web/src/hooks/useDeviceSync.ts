'use client';

import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@workspace/backend/convex/_generated/api';

/**
 * Hook that syncs device info with the backend once when a deviceId is available.
 * Uses the existing api.device.sync mutation.
 */
export function useDeviceSync(deviceId: string | null) {
  const syncDevice = useMutation(api.device.sync);

  useEffect(() => {
    if (!deviceId) return;
    syncDevice({
      deviceId,
      deviceName: 'Web Browser',
      osName: navigator.platform,
      osVersion: navigator.userAgent,
      brand: navigator.vendor,
    }).catch(console.error);
  }, [deviceId, syncDevice]);
}
