'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────

export type BreastSide = 'left' | 'right';

export interface TimerAction {
  side: BreastSide;
  type: 'start' | 'stop';
  timestamp: number; // epoch ms
}

export interface BreastTimerSession {
  version: 1;
  createdAt: number;
  actions: TimerAction[];
}

export interface SideState {
  elapsedMs: number; // total milliseconds
  isActive: boolean;
}

export interface BreastTimerState {
  left: SideState;
  right: SideState;
  toggle: (side: BreastSide) => void;
  reset: () => void;
  hasActivity: boolean;
}

// ── Helpers ───────────────────────────────────────────────

const STORAGE_KEY = 'baby-tracker:breast-timer';
const STALE_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Compute elapsed time and active state for one side from the action log. */
function computeSideElapsed(
  actions: TimerAction[],
  side: BreastSide,
  now: number
): SideState {
  const sideActions = actions.filter((a) => a.side === side);
  let elapsedMs = 0;
  let prevStart: number | null = null;

  for (const action of sideActions) {
    if (action.type === 'start') {
      prevStart = action.timestamp;
    } else if (action.type === 'stop' && prevStart !== null) {
      elapsedMs += action.timestamp - prevStart;
      prevStart = null;
    }
  }

  // If still active, add running interval up to `now`
  if (prevStart !== null) {
    elapsedMs += now - prevStart;
  }

  const lastAction = sideActions[sideActions.length - 1];
  const isActive = lastAction?.type === 'start';
  return { elapsedMs, isActive };
}

/** Format elapsed milliseconds as "MM:SS" or "H:MM:SS". */
export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Hook ────────────────────────────────────────────────

export function useBreastTimer(): BreastTimerState {
  // Load from localStorage on mount
  const [actions, setActions] = useState<TimerAction[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const session: BreastTimerSession = JSON.parse(raw);
      if (session.version !== 1) return [];
      if (Date.now() - session.createdAt > STALE_MS) return [];
      return session.actions;
    } catch {
      return [];
    }
  });

  // Tick for live elapsed display
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  // Persist to localStorage whenever actions change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (actions.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const createdAt = actions[0]?.timestamp ?? Date.now();
    const session: BreastTimerSession = { version: 1, createdAt, actions };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [actions]);

  // Toggle start/stop for a side
  const toggle = useCallback(
    (side: BreastSide) => {
      setActions((prev) => {
        const sideActions = prev.filter((a) => a.side === side);
        const lastAction = sideActions[sideActions.length - 1];
        const isActive = lastAction?.type === 'start';
        return [
          ...prev,
          { side, type: isActive ? 'stop' : 'start', timestamp: Date.now() },
        ];
      });
    },
    []
  );

  const reset = useCallback(() => {
    setActions([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const left = useMemo(() => computeSideElapsed(actions, 'left', now), [actions, now]);
  const right = useMemo(() => computeSideElapsed(actions, 'right', now), [actions, now]);
  const hasActivity = actions.length > 0;

  return { left, right, toggle, reset, hasActivity };
}
