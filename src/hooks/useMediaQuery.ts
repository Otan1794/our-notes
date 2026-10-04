'use client';

import { useSyncExternalStore } from 'react';

/**
 * Returns true/false for a CSS media query, or null during server render
 * and the first client render (before we know). Callers should render
 * nothing (or a placeholder) for null, to avoid a hydration mismatch.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => null
  );
}
