import { useRef, useEffect, useState } from "react";
import type { AutoSizerContainerProps } from "./types";

export function AutoSizerContainer({ children, className, style }: AutoSizerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    };

    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(container);

    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setSize({ width: clientWidth, height: clientHeight });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ ...style, minHeight: 100 }}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
