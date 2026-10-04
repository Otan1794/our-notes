'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks an element's width and updates on resize / device rotation.
 * Uses a callback ref (stored in state) so it still works when the element
 * mounts later, e.g. after the first category is created.
 */
export function useContainerWidth<T extends HTMLElement>(initial = 1200) {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    if (!node) return;
    setWidth(node.offsetWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNode, width] as const;
}
