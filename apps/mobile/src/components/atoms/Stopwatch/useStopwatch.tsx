import { DateTime, Duration } from 'luxon';
import { useCallback, useEffect, useMemo, useState } from 'react';

export enum StopwatchActionType {
  Start = 'start',
  Stop = 'stop',
}
export interface StopwatchAction {
  type: StopwatchActionType;
  timestamp: DateTime;
}
export interface StopwatchSettledState {
  elapsed: Duration<true>;
}
export function useStopwatch() {
  const [history, setHistory] = useState<StopwatchAction[]>([]);
  const [elapsed, setElapsed] = useState<Duration>(
    Duration.fromObject({ hour: 0, minutes: 0, seconds: 0 })
  );
  const start = useCallback(() => {
    setHistory((prev) => [
      ...prev,
      { type: StopwatchActionType.Start, timestamp: DateTime.now() },
    ]);
  }, []);
  const stop = useCallback(() => {
    const now = DateTime.now();
    setHistory((prev) => {
      const newHistory = [
        ...prev,
        { type: StopwatchActionType.Stop, timestamp: now },
      ];
      //settle state update before notify

      return newHistory;
    });
  }, []);
  const reset = useCallback(() => {
    setHistory(() => []); //clear history
  }, []);

  const toggle = useCallback(() => {
    const last = history.at(history.length - 1);
    switch (last?.type) {
      case undefined:
      case StopwatchActionType.Stop: {
        start();
        break;
      }
      case StopwatchActionType.Start: {
        stop();
        break;
      }
    }
  }, [history, start, stop]);

  useEffect(() => {
    //update elapsed from data
    const i = setInterval(() => {
      const stats = computeStopwatchState(history, DateTime.now());
      setElapsed(stats.elapsed);
    }, 100);
    return () => clearInterval(i);
  }, [history]);

  const isActive = useMemo(() => {
    return history.at(history.length - 1)?.type === StopwatchActionType.Start;
  }, [history]);
  return useMemo(
    () => ({ start, stop, reset, toggle, elapsed, isActive }),
    [elapsed, isActive, reset, start, stop, toggle]
  );
}

export function computeStopwatchState(
  history: StopwatchAction[],
  currentTime: DateTime
): StopwatchSettledState {
  const s = history.reduce(
    (state, e, eIdx) => {
      if (
        state.prevAction?.type === StopwatchActionType.Start &&
        e.type === StopwatchActionType.Stop
      ) {
        const addDuration = e.timestamp.diff(state.prevAction.timestamp);
        state.elapsed = state.elapsed.plus(addDuration); //add to the base duration
      }
      if (e.type === StopwatchActionType.Start && eIdx === history.length - 1) {
        //if last start event, add duration from current time
        state.elapsed = state.elapsed.plus(
          e.timestamp.diff(currentTime).negate()
        );
      }
      state.prevAction = e;
      return state;
    },
    {
      elapsed: Duration.fromObject({
        hours: 0,
        minutes: 0,
        seconds: 0,
      }),
      prevAction: null as StopwatchAction | null,
    }
  );
  return {
    elapsed: s.elapsed,
  };
}
