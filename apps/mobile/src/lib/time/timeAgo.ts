import { DateTime, Duration } from 'luxon';
export enum Format {
  HoursAndMinutes = "h'h,' m'm ago'",
  Day = "d 'day ago'",
  Days = "d 'days ago'",
}
export function timeAgo(p: { curDateTime: DateTime; dateTime: DateTime }) {
  const { curDateTime, dateTime } = p;
  if (!curDateTime.isValid) {
    throw new Error(`invalid curDateTime: ${curDateTime}`);
  }
  if (!dateTime.isValid) {
    throw new Error(`invalid dateTime: ${dateTime}`);
  }
  // Compute the difference as a Duration object
  const diff = curDateTime.diff(dateTime, [
    'days',
    'hours',
    'minutes',
    'seconds',
  ]);

  return {
    toString: () => formatDiffAsString(diff),
  };
}

function formatDiffAsString(diff: Duration) {
  // Format the duration
  if (diff.days == 0) {
    // if (diff.hours == 1) return diff.toFormat(Format.HourAndMinutes); //changed to h'h,' m'm ago' so no need for this
    if (diff.hours == 1) return diff.toFormat(Format.HoursAndMinutes);
    return diff.toFormat(Format.HoursAndMinutes);
  } else if (diff.days > 0) {
    if (diff.days == 1) return diff.toFormat(Format.Day);
    return diff.toFormat(Format.Days);
  }
  return diff.toFormat(Format.HoursAndMinutes);
}
