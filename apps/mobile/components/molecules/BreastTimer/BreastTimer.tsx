import { Duration } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export interface BreastTimerProps {
  onStop: (result: {
    totalDuration: {
      seconds: number;
    };
    left: TimerState;
    right: TimerState;
  }) => void;
}

interface TimerState {
  state: TimerStateEnum;
  duration: {
    seconds: number;
  };
}

enum BreastSide {
  Left = 'left',
  Right = 'right',
}
enum TimerStateEnum {
  None = 'none',
  Started = 'started',
  Stopped = 'stopped',
}
export function BreastTimer(props: BreastTimerProps) {
  const { onStop } = props;
  const [left, setLeft] = useState<TimerState>({
    state: TimerStateEnum.None,
    duration: { seconds: 0 },
  });
  const [right, setRight] = useState<TimerState>({
    state: TimerStateEnum.None,
    duration: { seconds: 0 },
  });
  const startOrResume = useCallback(
    (side: BreastSide) => {
      const fn = side === BreastSide.Right ? setRight : setLeft;
      const prevState = side === BreastSide.Right ? right : left;
      fn(() => ({
        ...prevState,
        state: TimerStateEnum.Started,
      }));
    },
    [left, right]
  );
  const stop = useCallback(
    (side: BreastSide) => {
      const fn = side === BreastSide.Right ? setRight : setLeft;
      fn((prevState) => {
        return {
          ...prevState,
          state: TimerStateEnum.Stopped,
        };
      });
      onStop({
        totalDuration: {
          seconds: left.duration.seconds + right.duration.seconds,
        },
        left,
        right,
      });
    },
    [left, onStop, right]
  );

  //view - current timers
  const isTimerActive = useCallback(
    (side: BreastSide) => {
      const data = side === BreastSide.Left ? left : right;
      return data.state === TimerStateEnum.Started;
    },
    [left, right]
  );
  //update with timer
  useEffect(() => {
    const interval = setInterval(() => {
      Object.values(BreastSide).map((side) => {
        const state = side === BreastSide.Left ? left.state : right.state;
        const update = () => {
          side === BreastSide.Left
            ? setLeft((prev) => ({
                ...prev,
                duration: { seconds: prev.duration?.seconds + 1 },
              }))
            : setRight((prev) => ({
                ...prev,
                duration: { seconds: prev.duration.seconds + 1 },
              }));
        };

        if (state === TimerStateEnum.Started) {
          update();
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [left.state, right.state]);
  const toggle = (side: BreastSide) => {
    const started = isTimerActive(side);
    if (started) {
      side === BreastSide.Left ? stop(BreastSide.Left) : stop(BreastSide.Right);
    } else {
      side === BreastSide.Left
        ? startOrResume(BreastSide.Left)
        : startOrResume(BreastSide.Right);
    }
  };
  const viewDuration = useCallback(
    (side: BreastSide) => {
      const selected = side === BreastSide.Left ? left : right;
      return Duration.fromObject({
        seconds: selected.duration.seconds,
      }).toFormat('hh:mm:ss');
    },
    [left, right]
  );
  return (
    <View className="flex-row items-center pt-3">
      <View className="flex-1 items-center">
        <View className="p-2">
          <Text>Left: {viewDuration(BreastSide.Left)}</Text>
        </View>
        <TouchableOpacity
          className="p-3 border border-gray-400 rounded-2xl bg-gray-200"
          onPress={() => toggle(BreastSide.Left)}
        >
          <Text>{!isTimerActive(BreastSide.Left) ? '▶️' : '⏹️'}</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-1 items-center">
        <View className="p-2">
          <Text>Right: {viewDuration(BreastSide.Right)}</Text>
        </View>
        <TouchableOpacity
          className="p-3 border border-gray-400 rounded-2xl bg-gray-200"
          onPress={() => toggle(BreastSide.Right)}
        >
          <Text>{!isTimerActive(BreastSide.Right) ? '▶️' : '⏹️'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
