import { RefObject, useEffect, useState } from 'react';
import { calcPageHeightPx } from '../utils/pdf';

export const usePagination = (
  containerRef: RefObject<HTMLElement>,
  dependencies: unknown[] = []
) => {
  const [breakIndices, setBreakIndices] = useState<Set<number>>(new Set());
  const [pageHeight] = useState<number>(calcPageHeightPx());

  useEffect(() => {
    const computeBreaks = () => {
      const container = containerRef.current;
      if (!container) return;
      const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-block]'));
      const nextBreaks = new Set<number>();
      let accumulated = 0;

      blocks.forEach((block, index) => {
        const height = block.offsetHeight;
        if (accumulated + height > pageHeight) {
          nextBreaks.add(index);
          accumulated = height;
        } else {
          accumulated += height;
        }
      });
      setBreakIndices(nextBreaks);
    };

    computeBreaks();
    const resizeObserver = new ResizeObserver(() => computeBreaks());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { breakIndices, pageHeight };
};
