import { DateTime, Duration } from 'luxon';
import { useCallback, useEffect, useState } from 'react';

enum StopwatchActionType {
  Start = 'start',
  Stop = 'stop',
}
interface StopwatchAction {
  type: StopwatchActionType;
  timestamp: DateTime;
}

enum StopwatchState {
  Initial = 'initial',
  Started = 'started',
  Stopped = 'stopped',
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
    setHistory((prev) => [
      ...prev,
      { type: StopwatchActionType.Stop, timestamp: DateTime.now() },
    ]);
  }, []);
  const reset = useCallback(() => {
    setHistory(() => []); //clear history
  }, []);

  useEffect(() => {
    //update elapsed from data
    const i = setInterval(() => {
      const stats = history.reduce(
        (state, e, eIdx) => {
          if (
            state.prevAction?.type === StopwatchActionType.Start &&
            e.type === StopwatchActionType.Stop
          ) {
            const addDuration = e.timestamp.diff(state.prevAction.timestamp);
            state.totalDurationElapsed =
              state.totalDurationElapsed.plus(addDuration); //add to the base duration
          }
          if (
            e.type === StopwatchActionType.Start &&
            eIdx === history.length - 1
          ) {
            //if last start event, add duration from current time
            state.totalDurationElapsed = state.totalDurationElapsed.plus(
              e.timestamp.diffNow()
            );
          }
          return state;
        },
        {
          totalDurationElapsed: Duration.fromObject({
            hours: 0,
            minutes: 0,
            seconds: 0,
          }),
          prevAction: null as StopwatchAction | null,
          state: StopwatchState.Initial,
        }
      );
      setElapsed(stats.totalDurationElapsed);
    }, 1000);
    return () => clearInterval(i);
  }, [history]);

  return { start, stop, reset, elapsed: elapsed };
}
