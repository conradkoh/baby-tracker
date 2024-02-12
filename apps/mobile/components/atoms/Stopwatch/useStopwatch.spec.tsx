import { DateTime } from 'luxon';
import {
  StopwatchAction,
  StopwatchActionType,
  computeStopwatchState,
} from './useStopwatch';

describe('stopwatch reducer', () => {
  beforeEach(async () => {});
  afterEach(async () => {});
  it('computes correct value from history', async () => {
    const history: StopwatchAction[] = [
      {
        type: StopwatchActionType.Start,
        timestamp: DateTime.fromISO('2016-05-25T09:08:34.123'),
      },
      {
        type: StopwatchActionType.Stop,
        timestamp: DateTime.fromISO('2016-05-25T09:08:36.123'),
      }, //+2 sec
      {
        type: StopwatchActionType.Start,
        timestamp: DateTime.fromISO('2016-05-25T09:08:37.123'),
      },
    ];

    const currentTime = DateTime.fromISO('2016-05-25T09:09:37.123'); //+1 min

    const result = computeStopwatchState(history, currentTime);
    expect(result.elapsed.as('seconds')).toBe(62);
  });
});
