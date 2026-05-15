'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'baby-tracker-device-id';

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Hook that manages a persistent device ID in localStorage.
 * Generates a new UUID on first visit and persists it across sessions.
 */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
}
