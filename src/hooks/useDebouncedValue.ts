import { useEffect, useState } from 'react';

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 *
 * Every time `value` changes, the effect's cleanup cancels the timer that was
 * waiting and a new one starts. So the returned value only updates once the
 * caller has been quiet for the whole delay.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
