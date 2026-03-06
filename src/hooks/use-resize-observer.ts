"use client";

import { useEffect, useState, useRef } from "react";

interface Size {
  width: number;
  height: number;
}

export function useResizeObserver<T extends HTMLElement>(
  callback?: (entry: ResizeObserverEntry) => void
): [React.RefObject<T | null>, Size] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
        if (callback) callback(entry);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback]);

  return [ref, size];
}
