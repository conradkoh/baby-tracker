import { DateTime } from 'luxon';
export function formatDateTime(date: DateTime) {
  return date.toFormat('dd LLL yyyy, h:mma');
}
