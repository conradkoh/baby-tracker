import { DateTime } from 'luxon';
export enum Format {
  HoursAndMinutes = "h 'hours,' m 'minutes ago'",
}
export function timeAgo(p: {
  curDateTime: DateTime;
  dateTime: DateTime;
  format: Format;
}) {
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

  // Format the duration
  const formattedDuration = diff.toFormat(p.format);
  return formattedDuration;
}
