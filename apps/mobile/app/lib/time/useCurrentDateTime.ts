import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
class Provider {
  dateTime: DateTime;
  private _interval: ReturnType<typeof setInterval>;
  listeners: ((curDateTime: DateTime<true>) => void)[];
  constructor() {
    this.dateTime = DateTime.now();
    this._interval = setInterval(() => {
      this.dateTime = DateTime.now();
      this.listeners.map((notify) => notify(this.dateTime));
    }, 1000);
    this.listeners = [];
  }
  subscribe(cb: (dt: DateTime<true>) => void) {
    this.listeners.push(cb);
    return cb;
  }
  unsubscribe(cb: (dt: DateTime<true>) => void) {
    this.listeners = this.listeners.filter((f) => f != cb);
  }
}
const provider = new Provider();
export function useCurrentDateTime() {
  const [curDateTime, setCurDateTime] = useState(DateTime.now());
  useEffect(() => {
    const ref = provider.subscribe((dt) => setCurDateTime(dt));
    return () => provider.unsubscribe(ref);
  }, []);
  return curDateTime;
}
