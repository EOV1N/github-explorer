import { useEffect, useState } from 'react';

/** Returns a copy of `value` that only updates after `delay` ms of quiet. */
export function useDebouncedValue<T>(value: T, delay = 450): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
